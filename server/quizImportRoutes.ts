/**
 * REST routes for quiz Excel import/export.
 * Mounted at /api/quiz in server/_core/index.ts
 */
import express, { Request, Response } from "express";
import multer from "multer";
import { parseQuizExcel, exportQuizToExcel, parsedToDbQuestions } from "./quizExcel";
import { getQuizById, getQuestionsByQuiz, getChoicesByQuestion } from "./quizDb";
// Auth handled via tRPC context; REST routes are public for now

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ── POST /api/quiz/import/preview ─────────────────────────────────────────────
// Parse an XLS/XLSX file and return the parsed questions for preview (no DB write)
router.post("/import/preview", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const result = parseQuizExcel(req.file.buffer);
    return res.json(result);
  } catch (err: unknown) {
    console.error("[Quiz Import] Parse error:", err);
    return res.status(500).json({ error: "Failed to parse Excel file", detail: String(err) });
  }
});

// ── GET /api/quiz/export/:quizId ──────────────────────────────────────────────
// Export a quiz to XLSX in the iSpring Template format
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
// Download a blank import template XLSX
router.get("/template", (_req: Request, res: Response) => {
  try {
    const buf = exportQuizToExcel("Quiz Import Template", []);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="quiz_import_template.xlsx"');
    return res.send(buf);
  } catch (err: unknown) {
    return res.status(500).json({ error: "Failed to generate template", detail: String(err) });
  }
});

export default router;
