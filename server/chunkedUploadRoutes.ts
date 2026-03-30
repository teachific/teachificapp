/**
 * Chunked upload routes — splits large ZIPs into 5 MB pieces to bypass proxy body limits.
 * Mounted at /api/chunked in server/_core/index.ts
 *
 * Flow for version upload:
 *   POST /api/chunked/version/:packageId/initiate   → { uploadId }
 *   POST /api/chunked/version/:packageId/chunk/:uploadId  (repeat per chunk, 5 MB each)
 *   POST /api/chunked/version/:packageId/finalize/:uploadId → assembles + processes directly
 *
 * The finalize handler calls processZipVersion() directly (no internal HTTP forward),
 * so the assembled file never crosses the proxy again.
 */
import express, { Request, Response } from "express";
import multer from "multer";
import { existsSync, unlinkSync, createWriteStream, createReadStream, statSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { nanoid } from "nanoid";
import { processZipVersion, emitProgress } from "./scormUploadRoutes";
import { storagePutStream } from "./storage";
import { getPackageById, updatePackage } from "./db";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";

const LARGE_FILE_LIMIT = 100 * 1024 * 1024; // 100 MB

const router = express.Router();

// ── Chunk multer — each chunk is a small binary blob ─────────────────────────
const chunkUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, tmpdir()),
    filename: (_req, file, cb) => cb(null, `chunk-${nanoid(12)}-${file.originalname}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per chunk max (client sends 512 KB chunks)
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
router.post("/version/:packageId/initiate", express.json(), async (req: Request, res: Response) => {
  const { totalChunks, filename, totalBytes } = req.body;
  if (!totalChunks || !filename) {
    return res.status(400).json({ error: "totalChunks and filename are required" });
  }

  // Restrict large uploads (> 100 MB) to site owner only
  const fileSizeBytes = parseInt(String(totalBytes ?? "0"), 10);
  if (fileSizeBytes > LARGE_FILE_LIMIT) {
    let isOwner = false;
    try {
      const user = await sdk.authenticateRequest(req);
      // site_owner and site_admin have unlimited upload access; fallback: openId match
      isOwner = !!(user && (user.role === "site_owner" || user.role === "site_admin" || user.openId === ENV.ownerOpenId));
    } catch {
      isOwner = false;
    }
    if (!isOwner) {
      return res.status(403).json({
        error: "File size is restricted to 100 MB.",
      });
    }
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
// Assembles all chunks into one temp file, then calls processZipVersion directly.
// No internal HTTP forward — the assembled file never crosses the proxy again.
router.post(
  "/version/:packageId/finalize/:uploadId",
  express.json(),
  async (req: Request, res: Response) => {
    const { uploadId, packageId: packageIdStr } = req.params;
    const packageId = parseInt(packageIdStr, 10);
    const session = sessions.get(uploadId);
    if (!session) return res.status(404).json({ error: "Upload session not found" });

    if (session.receivedChunks.size !== session.totalChunks) {
      return res.status(400).json({
        error: `Missing chunks: received ${session.receivedChunks.size} of ${session.totalChunks}`,
      });
    }

    const assembledPath = join(tmpdir(), `assembled-${uploadId}-${session.filename}`);
    try {
      // 1. Assemble all chunks into one temp file (pure disk I/O, no RAM buffer)
      await assembleChunks(session, assembledPath);
      cleanupSession(session); // free chunk temp files immediately

      const fileSize = statSync(assembledPath).size;
      const { uploadedBy, changelog } = req.body;
      const uploadedByNum = parseInt(String(uploadedBy ?? "0"), 10);
      const changelogStr = String(changelog ?? "New version");

      // 2. Look up package to get orgId
      const pkg = await getPackageById(packageId);
      if (!pkg) {
        if (existsSync(assembledPath)) unlinkSync(assembledPath);
        return res.status(404).json({ error: "Package not found" });
      }

      const suffix = nanoid(8);
      const orgId = pkg.orgId;

      // 3. Stream original ZIP to S3 (true streaming — no RAM buffer)
      const zipKey = `orgs/${orgId}/packages/${suffix}/original.zip`;
      const { url: zipUrl } = await storagePutStream(zipKey, assembledPath, "application/zip");

      // 4. Mark package as processing
      await updatePackage(packageId, { status: "processing" });

      // 5. Respond immediately — processing runs in the background
      res.json({
        packageId,
        zipUrl,
        status: "processing",
        message: "Version upload received. Processing in background.",
      });

      // 6. Process ZIP asynchronously (extracts files, uploads to S3, updates DB)
      processZipVersion(assembledPath, fileSize, packageId, orgId, suffix, uploadedByNum, changelogStr)
        .catch((err) => {
          console.error(`[Chunked Version] Package ${packageId} failed:`, err);
          emitProgress(packageId, 0, 1, "error");
          updatePackage(packageId, { status: "error", processingError: String(err) }).catch(console.error);
        });

    } catch (err: unknown) {
      cleanupSession(session);
      if (existsSync(assembledPath)) {
        try { unlinkSync(assembledPath); } catch { /* ignore */ }
      }
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

function cleanupSession(session: UploadSession) {
  const paths = Array.from(session.chunkPaths.values());
  for (const chunkPath of paths) {
    try { if (existsSync(chunkPath)) unlinkSync(chunkPath); } catch { /* ignore */ }
  }
  sessions.delete(session.uploadId);
}

export default router;
