/**
 * Content proxy routes for serving extracted SCORM/HTML package files.
 * Mounted at /api/content in server/_core/index.ts
 *
 * GET /api/content/:packageId/entry  — redirect to the entry point S3 URL
 * GET /api/content/:packageId/*      — redirect to the matching file's S3 URL
 *
 * Since all S3 files are public CDN URLs, we simply redirect to them.
 * This keeps the iframe src clean (/api/content/1/entry) while the browser
 * fetches assets directly from CloudFront.
 */
import express, { Request, Response } from "express";
import { getDb } from "./db";
import { fileAssets, contentPackages } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

const router = express.Router();

// GET /api/content/:packageId/entry — redirect to the entry point file
router.get("/:packageId/entry", async (req: Request, res: Response) => {
  try {
    const packageId = parseInt(req.params.packageId, 10);
    if (!packageId) return res.status(400).json({ error: "Invalid packageId" });

    const db = await getDb();
    if (!db) return res.status(503).json({ error: "DB unavailable" });

    // Get the package to find extractedFolderKey and scormEntryPoint
    const pkgs = await db.select().from(contentPackages).where(eq(contentPackages.id, packageId)).limit(1);
    const pkg = pkgs[0];
    if (!pkg) return res.status(404).json({ error: "Package not found" });
    if (pkg.status !== "ready") return res.status(202).json({ error: "Package still processing", status: pkg.status });

    // Find the entry point file asset
    // First try: look for a file_asset where isEntryPoint = 1
    let entryAsset = null;
    const allAssets = await db.select().from(fileAssets).where(eq(fileAssets.packageId, packageId));

    // Try isEntryPoint flag first
    entryAsset = allAssets.find((a) => Boolean(a.isEntryPoint));

    // Fallback: match scormEntryPoint path (could be just "index.html" or full path)
    if (!entryAsset && pkg.scormEntryPoint) {
      const ep = pkg.scormEntryPoint.toLowerCase();
      entryAsset = allAssets.find((a) => a.relativePath.toLowerCase() === ep);
      // If not exact match, find a file ending with the entry point name
      if (!entryAsset) {
        entryAsset = allAssets.find((a) => a.relativePath.toLowerCase().endsWith("/" + ep) || a.relativePath.toLowerCase() === ep);
      }
    }

    // Last resort: find any index.html
    if (!entryAsset) {
      entryAsset = allAssets.find((a) => a.relativePath.toLowerCase().endsWith("/index.html") || a.relativePath.toLowerCase() === "index.html");
    }
    if (!entryAsset) {
      entryAsset = allAssets.find((a) => a.relativePath.toLowerCase().endsWith("/story.html"));
    }
    if (!entryAsset) {
      entryAsset = allAssets.find((a) => a.mimeType === "text/html");
    }

    if (!entryAsset) {
      return res.status(404).json({ error: "No entry point found for this package" });
    }

    // Redirect to the CDN URL
    return res.redirect(302, entryAsset.s3Url);
  } catch (err) {
    console.error("[Content] Entry redirect error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
});

// GET /api/content/:packageId/* — redirect to the matching file's S3 URL
router.get("/:packageId/*", async (req: Request, res: Response) => {
  try {
    const packageId = parseInt(req.params.packageId, 10);
    if (!packageId) return res.status(400).json({ error: "Invalid packageId" });

    const filePath = (req.params as Record<string, string>)["0"] || "";
    if (!filePath) return res.redirect(302, `/api/content/${packageId}/entry`);

    const db = await getDb();
    if (!db) return res.status(503).json({ error: "DB unavailable" });

    const allAssets = await db.select().from(fileAssets).where(eq(fileAssets.packageId, packageId));

    // Try exact match first
    let asset = allAssets.find((a) => a.relativePath.toLowerCase() === filePath.toLowerCase());

    // Try suffix match (file is nested inside a subfolder)
    if (!asset) {
      asset = allAssets.find((a) => a.relativePath.toLowerCase().endsWith("/" + filePath.toLowerCase()));
    }

    if (!asset) {
      return res.status(404).json({ error: `File not found: ${filePath}` });
    }

    return res.redirect(302, asset.s3Url);
  } catch (err) {
    console.error("[Content] File redirect error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
});

export default router;
