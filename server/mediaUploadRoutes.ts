/**
 * Media upload route — handles direct file uploads from the browser.
 * Mounted at /api/media-upload in server/_core/index.ts
 *
 * POST /api/media-upload
 *   Accepts: multipart/form-data with fields:
 *     - file: the file to upload
 *     - orgId: the organization ID (for path namespacing)
 *     - folder: optional subfolder (e.g. "downloads", "forms", "media")
 *   Returns: { key, url, fileName, fileSize, fileType }
 */
import express, { Request, Response } from "express";
import multer from "multer";
import { tmpdir } from "os";
import { nanoid } from "nanoid";
import { storagePutStream } from "./storage";
import { sdk } from "./_core/sdk";

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, tmpdir()),
    filename: (_req, file, cb) => {
      const ext = file.originalname.split(".").pop() ?? "bin";
      cb(null, `media-${nanoid(12)}.${ext}`);
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB max
});

router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  try {
    // Verify auth via session cookie (same as tRPC context)
    const user = await sdk.authenticateRequest(req).catch(() => null);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }

    const orgId = req.body.orgId ? Number(req.body.orgId) : 0;
    const folder = (req.body.folder as string) ?? "media";
    const safeName = req.file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 100);
    const key = `${folder}/${orgId}/${Date.now()}-${nanoid(8)}-${safeName}`;

    const { url } = await storagePutStream(
      key,
      req.file.path,
      req.file.mimetype || "application/octet-stream"
    );

    res.json({
      key,
      url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
    });
  } catch (err: any) {
    console.error("[media-upload] error:", err);
    res.status(500).json({ error: err.message ?? "Upload failed" });
  }
});

export default router;
