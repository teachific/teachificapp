import express, { type Express } from "express";
import fs from "fs";
import path from "path";

/**
 * Production static file server.
 * Serves the built client from dist/public.
 * This file has NO vite imports so it can be safely bundled for production.
 */
export function serveStatic(app: Express) {
  // In production, the server bundle is at dist/index.js and static files are at dist/public
  // import.meta.dirname is dist/ so public is at dist/public
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist (SPA routing)
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
