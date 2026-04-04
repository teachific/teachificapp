/**
 * REST routes for quiz Excel import/export.
 * Mounted at /api/quiz in server/_core/index.ts
 *
 * Supports:
 *  - POST /api/quiz/import/preview  — accepts .xlsx, .xls, or .zip (with media/ folder)
 *  - GET  /api/quiz/export/:quizId  — export quiz to XLSX
 *  - GET  /api/quiz/template        — download Teachific ZIP import template (redirects to CDN)
 *  - GET  /api/quiz/template/xlsx   — download XLSX-only template
 */
import express, { Request, Response } from "express";
import multer from "multer";
import unzipper from "unzipper";
import { Readable } from "stream";
import { storagePut } from "./storage";
import { parseQuizExcel, exportQuizToExcel, parsedToDbQuestions } from "./quizExcel";
import { getQuizById, getQuestionsByQuiz, getChoicesByQuestion } from "./quizDb";

// CDN URLs for the pre-built Teachific templates
const TEMPLATE_ZIP_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663401463434/fJXMsdmk8vcb8V4GDt37f6/TeachificQuizImportTemplate_a611ae1e.zip";
const TEMPLATE_XLSX_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663401463434/fJXMsdmk8vcb8V4GDt37f6/QuizImportTemplate_ad09d65c.xlsx";

const router = express.Router();
// Accept up to 3 GB for ZIP files with media
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3 * 1024 * 1024 * 1024 } });

/**
 * Extract a ZIP buffer into:
 *   - xlsxBuffer: the first .xlsx/.xls file found
 *   - mediaMap: Map<relativePath, Buffer>  e.g. "media/image.jpg" → Buffer
 */
async function extractZip(
  zipBuffer: Buffer
): Promise<{ xlsxBuffer: Buffer | null; mediaMap: Map<string, Buffer> }> {
  const mediaMap = new Map<string, Buffer>();
  let xlsxBuffer: Buffer | null = null;

  const readable = Readable.from(zipBuffer);
  const directory = readable.pipe(unzipper.Parse({ forceStream: true }));

  for await (const entry of directory) {
    const entryPath: string = (entry as any).path as string;
    const type: string = (entry as any).type as string;

    if (type === "Directory") {
      await (entry as any).autodrain();
      continue;
    }

    const chunks: Buffer[] = [];
    for await (const chunk of entry) {
      chunks.push(chunk as Buffer);
    }
    const buf = Buffer.concat(chunks);
    const lower = entryPath.toLowerCase();

    if (!xlsxBuffer && (lower.endsWith(".xlsx") || lower.endsWith(".xls"))) {
      xlsxBuffer = buf;
      continue;
    }

    if (
      lower.includes("media/") &&
      /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov|avi|mp3|wav|ogg|m4a|aac)$/i.test(lower)
    ) {
      const normalized = entryPath.replace(/^.*?(media\/.+)$/, "$1");
      mediaMap.set(normalized, buf);
    }
  }

  return { xlsxBuffer, mediaMap };
}

/**
 * Upload all media files in the map to S3 and return a path→URL map.
 */
async function uploadMediaToS3(
  mediaMap: Map<string, Buffer>,
  orgId: string
): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
    mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
    avi: "video/x-msvideo", mp3: "audio/mpeg", wav: "audio/wav",
    ogg: "audio/ogg", m4a: "audio/mp4", aac: "audio/aac",
  };

  await Promise.all(
    Array.from(mediaMap.entries()).map(async ([relPath, buf]) => {
      const ext = relPath.split(".").pop()?.toLowerCase() ?? "bin";
      const mime = mimeTypes[ext] ?? "application/octet-stream";
      const fileName = relPath.split("/").pop() ?? "file";
      const key = `quiz-imports/${orgId}/${Date.now()}-${fileName}`;
      try {
        const { url } = await storagePut(key, buf, mime);
        urlMap.set(relPath, url);
        urlMap.set(relPath.replace(/\//g, "\\\\"), url);
      } catch (e) {
        console.error(`[Quiz Import] Failed to upload media ${relPath}:`, e);
      }
    })
  );

  return urlMap;
}

// ── POST /api/quiz/import/preview ─────────────────────────────────────────────
// Parse an XLS/XLSX or ZIP file and return parsed questions for preview (no DB write)
router.post("/import/preview", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const orgId = (req as any).user?.orgId?.toString() ?? "unknown";
    const originalName = req.file.originalname.toLowerCase();
    let xlsxBuffer = req.file.buffer;
    let mediaUrlMap = new Map<string, string>();

    // Handle ZIP upload
    if (originalName.endsWith(".zip")) {
      const { xlsxBuffer: extracted, mediaMap } = await extractZip(req.file.buffer);
      if (!extracted) {
        return res.status(400).json({ error: "No Excel file (.xlsx or .xls) found inside the ZIP." });
      }
      xlsxBuffer = extracted;
      if (mediaMap.size > 0) {
        mediaUrlMap = await uploadMediaToS3(mediaMap, orgId);
      }
    }

    const result = parseQuizExcel(xlsxBuffer);

    // Replace local media paths with S3 URLs
    if (mediaUrlMap.size > 0) {
      for (const q of result.questions) {
        if (q.imagePath) {
          const url = mediaUrlMap.get(q.imagePath) ?? mediaUrlMap.get(q.imagePath.replace(/\\/g, "/"));
          if (url) q.imagePath = url;
        }
        if (q.videoPath) {
          const url = mediaUrlMap.get(q.videoPath) ?? mediaUrlMap.get(q.videoPath.replace(/\\/g, "/"));
          if (url) q.videoPath = url;
        }
        if (q.audioPath) {
          const url = mediaUrlMap.get(q.audioPath) ?? mediaUrlMap.get(q.audioPath.replace(/\\/g, "/"));
          if (url) q.audioPath = url;
        }
      }
    }

    return res.json({ ...result, mediaUploaded: mediaUrlMap.size });
  } catch (err: unknown) {
    console.error("[Quiz Import] Parse error:", err);
    return res.status(500).json({ error: "Failed to parse file", detail: String(err) });
  }
});

// ── GET /api/quiz/export/:quizId ──────────────────────────────────────────────
// Export a quiz to XLSX in the Teachific Template format
router.get("/export/:quizId", async (req: Request, res: Response) => {
  try {
    const quizId = parseInt(req.params.quizId, 10);
    if (isNaN(quizId)) return res.status(400).json({ error: "Invalid quiz ID" });

    const quiz = await getQuizById(quizId);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const questions = await getQuestionsByQuiz(quizId);
    const questionsWithChoices = await Promise.all(
      questions.map(async (q) => ({
        questionType: q.questionType as any,
        questionText: q.questionText,
        imagePath: q.imageUrl ?? undefined,
        explanation: q.explanation ?? undefined,
        points: q.points,
        correctFeedback: undefined as string | undefined,
        incorrectFeedback: undefined as string | undefined,
        choices: (await getChoicesByQuestion(q.id)).map((c) => ({
          sortOrder: c.sortOrder,
          choiceText: c.choiceText,
          isCorrect: c.isCorrect,
          matchTarget: c.matchTarget ?? undefined,
        })),
      }))
    );

    const buf = exportQuizToExcel(quiz.title, questionsWithChoices);

    const filename = `${quiz.title.replace(/[^a-z0-9]/gi, "_")}_quiz.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(buf);
  } catch (err: unknown) {
    console.error("[Quiz Export] Error:", err);
    return res.status(500).json({ error: "Failed to export quiz", detail: String(err) });
  }
});

// ── GET /api/quiz/template ────────────────────────────────────────────────────
// Redirect to the pre-built Teachific ZIP import template (includes sample media)
router.get("/template", (_req: Request, res: Response) => {
  res.redirect(302, TEMPLATE_ZIP_URL);
});

// ── GET /api/quiz/template/xlsx ───────────────────────────────────────────────
// Redirect to the XLSX-only template (no media, for simple imports)
router.get("/template/xlsx", (_req: Request, res: Response) => {
  res.redirect(302, TEMPLATE_XLSX_URL);
});

export default router;
