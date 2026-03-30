/**
 * Chunked upload routes — splits large ZIPs into 5 MB pieces to bypass proxy body limits.
 * Mounted at /api/chunked in server/_core/index.ts
 *
 * Flow for version upload:
 *   POST /api/chunked/version/:packageId/initiate   → { uploadId }
 *   POST /api/chunked/version/:packageId/chunk/:uploadId  (repeat per chunk)
 *   POST /api/chunked/version/:packageId/finalize/:uploadId → triggers processing
 *
 * After finalize, the assembled ZIP is handed to the existing /api/upload/version/:id
 * route via an internal HTTP POST so all SSE progress logic is reused unchanged.
 */
import express, { Request, Response } from "express";
import multer from "multer";
import { existsSync, unlinkSync, createWriteStream, createReadStream, statSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { nanoid } from "nanoid";
import FormData from "form-data";
import http from "http";

const router = express.Router();

// ── Chunk multer — each chunk is a small binary blob ─────────────────────────
const chunkUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, tmpdir()),
    filename: (_req, file, cb) => cb(null, `chunk-${nanoid(12)}-${file.originalname}`),
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB per chunk max
});

// ── In-memory upload session registry ────────────────────────────────────────
interface UploadSession {
  uploadId: string;
  totalChunks: number;
  receivedChunks: Set<number>;
  chunkPaths: Map<number, string>;
  filename: string;
}

const sessions = new Map<string, UploadSession>();

// ── POST /api/chunked/version/:packageId/initiate ─────────────────────────────
router.post("/version/:packageId/initiate", express.json(), (req: Request, res: Response) => {
  const { totalChunks, filename } = req.body;
  if (!totalChunks || !filename) {
    return res.status(400).json({ error: "totalChunks and filename are required" });
  }
  const uploadId = nanoid(16);
  sessions.set(uploadId, {
    uploadId,
    totalChunks: parseInt(String(totalChunks), 10),
    receivedChunks: new Set(),
    chunkPaths: new Map(),
    filename: String(filename),
  });
  return res.json({ uploadId });
});

// ── POST /api/chunked/version/:packageId/chunk/:uploadId ──────────────────────
router.post(
  "/version/:packageId/chunk/:uploadId",
  chunkUpload.single("chunk"),
  (req: Request, res: Response) => {
    const { uploadId } = req.params;
    const chunkIndex = parseInt(String(req.body.chunkIndex ?? "-1"), 10);
    const tmpPath = (req.file as (Express.Multer.File & { path: string }) | undefined)?.path;

    const session = sessions.get(uploadId);
    if (!session) {
      if (tmpPath && existsSync(tmpPath)) unlinkSync(tmpPath);
      return res.status(404).json({ error: "Upload session not found" });
    }
    if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
      if (tmpPath && existsSync(tmpPath)) unlinkSync(tmpPath);
      return res.status(400).json({ error: "Invalid chunkIndex" });
    }
    if (!req.file || !tmpPath) {
      return res.status(400).json({ error: "No chunk data received" });
    }

    session.chunkPaths.set(chunkIndex, tmpPath);
    session.receivedChunks.add(chunkIndex);

    return res.json({
      uploadId,
      chunkIndex,
      received: session.receivedChunks.size,
      total: session.totalChunks,
    });
  }
);

// ── POST /api/chunked/version/:packageId/finalize/:uploadId ───────────────────
router.post(
  "/version/:packageId/finalize/:uploadId",
  express.json(),
  async (req: Request, res: Response) => {
    const { uploadId, packageId } = req.params;
    const session = sessions.get(uploadId);
    if (!session) return res.status(404).json({ error: "Upload session not found" });

    if (session.receivedChunks.size !== session.totalChunks) {
      return res.status(400).json({
        error: `Missing chunks: received ${session.receivedChunks.size} of ${session.totalChunks}`,
      });
    }

    const assembledPath = join(tmpdir(), `assembled-${uploadId}-${session.filename}`);
    try {
      await assembleChunks(session, assembledPath);

      const { uploadedBy, changelog } = req.body;

      // Forward the assembled file to the existing /api/upload/version/:packageId
      // route as a multipart POST — this reuses all SSE progress logic unchanged.
      const port = parseInt(process.env.PORT ?? "3000", 10);
      const result = await forwardToUploadRoute(
        assembledPath,
        session.filename,
        packageId,
        String(uploadedBy ?? "0"),
        String(changelog ?? "New version"),
        port
      );

      cleanupSession(session);
      return res.json(result);
    } catch (err: unknown) {
      cleanupSession(session);
      console.error("[Chunked Version Finalize] Error:", err);
      return res.status(500).json({ error: "Finalize failed", detail: String(err) });
    }
  }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assembleChunks(session: UploadSession, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const writeStream = createWriteStream(outputPath);
    writeStream.on("error", reject);

    let i = 0;
    function writeNext() {
      if (i >= session.totalChunks) {
        writeStream.end();
        writeStream.on("finish", resolve);
        return;
      }
      const chunkPath = session.chunkPaths.get(i);
      if (!chunkPath || !existsSync(chunkPath)) {
        writeStream.destroy(new Error(`Chunk ${i} missing at path: ${chunkPath}`));
        return;
      }
      const readStream = createReadStream(chunkPath);
      readStream.on("error", (err) => writeStream.destroy(err));
      readStream.on("end", () => {
        i++;
        writeNext();
      });
      readStream.pipe(writeStream, { end: false });
    }
    writeNext();
  });
}

function forwardToUploadRoute(
  filePath: string,
  filename: string,
  packageId: string,
  uploadedBy: string,
  changelog: string,
  port: number
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", createReadStream(filePath), {
      filename,
      contentType: "application/zip",
      knownLength: statSync(filePath).size,
    });
    form.append("uploadedBy", uploadedBy);
    form.append("changelog", changelog);

    const options: http.RequestOptions = {
      hostname: "127.0.0.1",
      port,
      path: `/api/upload/version/${packageId}`,
      method: "POST",
      headers: form.getHeaders(),
      // No timeout — let the server-side 10-min timeout apply
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if ((res.statusCode ?? 500) >= 400) {
            reject(new Error(parsed.error ?? `HTTP ${res.statusCode}`));
          } else {
            resolve(parsed);
          }
        } catch {
          reject(new Error(`Invalid JSON response: ${body.slice(0, 200)}`));
        }
      });
    });

    req.on("error", reject);
    form.pipe(req);
  });
}

function cleanupSession(session: UploadSession) {
  const paths = Array.from(session.chunkPaths.values());
  for (const chunkPath of paths) {
    try { if (existsSync(chunkPath)) unlinkSync(chunkPath); } catch { /* ignore */ }
  }
  sessions.delete(session.uploadId);
}

export default router;
