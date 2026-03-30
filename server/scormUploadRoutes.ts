/**
 * REST routes for SCORM/HTML ZIP file upload and extraction.
 * Mounted at /api/upload in server/_core/index.ts
 *
 * POST /api/upload/package  — upload a ZIP, store to S3, extract, parse SCORM manifest
 * GET  /api/upload/status/:packageId — poll processing status
 */
import express, { Request, Response } from "express";
import multer from "multer";
import unzipper from "unzipper";
import { Readable } from "stream";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";
import { parseScormManifest } from "./scormParser";
import { createPackage, updatePackage, createVersion, createFileAsset, getPackageById } from "./db";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
});

// ── POST /api/upload/package ──────────────────────────────────────────────────
router.post("/package", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const orgId = parseInt(req.body.orgId ?? "0", 10);
    const uploadedBy = parseInt(req.body.uploadedBy ?? "0", 10);
    const title = req.body.title ?? req.file.originalname.replace(/\.zip$/i, "");
    const displayMode = req.body.displayMode ?? "native";
    const lmsShellConfig = req.body.lmsShellConfig;

    if (!orgId || !uploadedBy) {
      return res.status(400).json({ error: "orgId and uploadedBy are required" });
    }

    const suffix = nanoid(8);
    const zipKey = `orgs/${orgId}/packages/${suffix}/${req.file.originalname}`;

    // 1. Store original ZIP to S3
    const { url: zipUrl } = await storagePut(zipKey, req.file.buffer, "application/zip");

    // 2. Create package record (status: uploading)
    await createPackage({
      orgId,
      uploadedBy,
      title,
      originalZipKey: zipKey,
      originalZipUrl: zipUrl,
      originalZipSize: req.file.size,
      contentType: "unknown",
      scormVersion: "none",
      displayMode,
      lmsShellConfig,
      status: "processing",
    });

    // Get the newly created package (most recent for this org)
    // We'll do a quick re-query via a helper
    const { getDb } = await import("./db");
    const { contentPackages } = await import("../drizzle/schema");
    const { desc, eq } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "DB unavailable" });

    const pkgs = await db.select().from(contentPackages)
      .where(eq(contentPackages.orgId, orgId))
      .orderBy(desc(contentPackages.createdAt))
      .limit(1);
    const pkg = pkgs[0];
    if (!pkg) return res.status(500).json({ error: "Package creation failed" });

    // 3. Extract ZIP asynchronously and update package
    processZip(req.file.buffer, pkg.id, orgId, suffix).catch((err) => {
      console.error(`[ZIP Processing] Package ${pkg.id} failed:`, err);
      updatePackage(pkg.id, { status: "error", processingError: String(err) }).catch(console.error);
    });

    return res.json({
      packageId: pkg.id,
      zipUrl,
      status: "processing",
      message: "Upload received. Processing in background.",
    });
  } catch (err: unknown) {
    console.error("[Upload] Error:", err);
    return res.status(500).json({ error: "Upload failed", detail: String(err) });
  }
});

// ── GET /api/upload/status/:packageId ─────────────────────────────────────────
router.get("/status/:packageId", async (req: Request, res: Response) => {
  try {
    const packageId = parseInt(req.params.packageId, 10);
    const pkg = await getPackageById(packageId);
    if (!pkg) return res.status(404).json({ error: "Package not found" });
    return res.json({
      packageId: pkg.id,
      status: pkg.status,
      contentType: pkg.contentType,
      scormVersion: pkg.scormVersion,
      scormEntryPoint: pkg.scormEntryPoint,
      processingError: pkg.processingError,
    });
  } catch (err: unknown) {
    return res.status(500).json({ error: "Status check failed", detail: String(err) });
  }
});

// ─── Background ZIP processing ────────────────────────────────────────────────
async function processZip(
  buffer: Buffer,
  packageId: number,
  orgId: number,
  suffix: string
) {
  const extractedFiles: Array<{ key: string; url: string; path: string; size: number; mimeType: string }> = [];
  let manifestXml: string | null = null;
  let entryPoint: string | null = null;
  let indexHtmlPath: string | null = null;

  // Extract all files from ZIP
  const directory = await unzipper.Open.buffer(buffer);

  for (const file of directory.files) {
    if (file.type === "Directory") continue;

    const filePath = file.path.replace(/^\//, ""); // strip leading slash
    const fileBuffer = await file.buffer();
    const mimeType = guessMime(filePath);
    const s3Key = `orgs/${orgId}/packages/${suffix}/extracted/${filePath}`;

    const { url: fileS3Url } = await storagePut(s3Key, fileBuffer, mimeType);
    extractedFiles.push({ key: s3Key, url: fileS3Url, path: filePath, size: fileBuffer.length, mimeType });

    // Capture imsmanifest.xml for SCORM parsing
    if (filePath.toLowerCase() === "imsmanifest.xml" || filePath.toLowerCase().endsWith("/imsmanifest.xml")) {
      manifestXml = fileBuffer.toString("utf-8");
    }

    // Track index.html as fallback entry point
    if (filePath.toLowerCase() === "index.html" || filePath.toLowerCase() === "story.html" || filePath.toLowerCase() === "index_lms.html") {
      if (!indexHtmlPath) indexHtmlPath = filePath;
    }
  }

  // Parse SCORM manifest if present
  let scormVersion: "1.2" | "2004" | "none" = "none";
  let scormEntryPoint: string | undefined;
  let scormManifest: string | undefined;
  let contentType: "scorm" | "html" | "articulate" | "ispring" | "unknown" = "unknown";

  if (manifestXml) {
    try {
      const parsed = await parseScormManifest(manifestXml);
      scormVersion = (parsed?.version ?? "none") as "1.2" | "2004" | "none";
      scormEntryPoint = parsed?.entryPoint ?? undefined;
      scormManifest = JSON.stringify(parsed);
      contentType = "scorm";

      // Detect Articulate/iSpring
      if (manifestXml.includes("articulate") || manifestXml.includes("Articulate")) contentType = "articulate";
      if (manifestXml.includes("ispring") || manifestXml.includes("iSpring")) contentType = "ispring";
    } catch (e) {
      console.warn("[SCORM Parse] Failed to parse manifest:", e);
    }
  } else if (indexHtmlPath) {
    contentType = "html";
    entryPoint = indexHtmlPath;
  }

  // Resolve entry point URL
  const resolvedEntryPath = scormEntryPoint ?? entryPoint ?? indexHtmlPath ?? "index.html"; // always a string
  const entryAsset = extractedFiles.find(
    (f) => f.path.toLowerCase() === resolvedEntryPath.toLowerCase()
  );
  const entryUrl = entryAsset?.url ?? "";

  // Create a version record
  await createVersion({
    packageId,
    versionNumber: 1,
    versionLabel: "v1.0",
    changelog: "Initial upload",
    zipKey: (extractedFiles[0]?.key?.split("/extracted/")[0] ?? "") + "/original.zip",
    zipUrl: "",
    zipSize: buffer.length,
    extractedFolderKey: `orgs/${orgId}/packages/${suffix}/extracted/`,
    entryPoint: resolvedEntryPath,
    fileCount: extractedFiles.length,
    uploadedBy: 0, // system
  });

  // Get the version ID
  const { getVersionsByPackage } = await import("./db");
  const versions = await getVersionsByPackage(packageId);
  const versionId = versions[0]?.id;

  // Store file assets
  if (versionId) {
    for (const f of extractedFiles) {
      await createFileAsset({
        packageId,
        versionId,
        relativePath: f.path,
        s3Key: f.key,
        s3Url: f.url,
        fileSize: f.size,
        mimeType: f.mimeType,
        isEntryPoint: f.path.toLowerCase() === resolvedEntryPath.toLowerCase(),
      });
    }
  }

  // Update package to ready
  await updatePackage(packageId, {
    status: "ready",
    contentType,
    scormVersion,
    scormEntryPoint: resolvedEntryPath,
    scormManifest,
    extractedFolderKey: `orgs/${orgId}/packages/${suffix}/extracted/`,
    currentVersionId: versionId,
  });

  console.log(`[ZIP Processing] Package ${packageId} ready. ${extractedFiles.length} files extracted.`);
}

function guessMime(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const mimeMap: Record<string, string> = {
    html: "text/html",
    htm: "text/html",
    css: "text/css",
    js: "application/javascript",
    mjs: "application/javascript",
    json: "application/json",
    xml: "application/xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
    mp4: "video/mp4",
    webm: "video/webm",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    otf: "font/otf",
    pdf: "application/pdf",
    zip: "application/zip",
    swf: "application/x-shockwave-flash",
    ico: "image/x-icon",
    txt: "text/plain",
  };
  return mimeMap[ext] ?? "application/octet-stream";
}

export default router;
