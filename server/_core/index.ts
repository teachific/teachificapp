import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import quizImportRouter from "../quizImportRoutes";
import scormUploadRouter from "../scormUploadRoutes";
import chunkedUploadRouter from "../chunkedUploadRoutes";
import contentRouter from "../contentRoutes";
import digitalDownloadRouter from "../digitalDownloadRoutes";
import mediaUploadRouter from "../mediaUploadRoutes";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Increase timeout to 10 minutes for large file uploads (458 MB+)
  server.timeout = 10 * 60 * 1000;
  server.keepAliveTimeout = 10 * 60 * 1000;
  server.headersTimeout = 10 * 60 * 1000 + 5000;

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Allow embed pages and content to be framed by any external site
  app.use((req, res, next) => {
    const path = req.path;
    if (path.startsWith("/embed/") || path.startsWith("/api/content/")) {
      res.removeHeader("X-Frame-Options");
      res.setHeader("X-Frame-Options", "ALLOWALL");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    }
    next();
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Quiz Excel import/export
  app.use("/api/quiz", quizImportRouter);

  // SCORM/HTML ZIP upload
  app.use("/api/upload", scormUploadRouter);

  // Chunked upload for large files — bypasses proxy body size limit
  app.use("/api/chunked", chunkedUploadRouter);

  // Content file proxy — serves extracted package files by redirecting to S3 CDN URLs
  // MUST be before tRPC and Vite so /api/content/* doesn't fall through to the SPA
  app.use("/api/content", contentRouter);

  // Secure digital download — validates token, checks access controls, redirects to S3
  app.use("/api/download", digitalDownloadRouter);

  // Media upload — server-side proxy for browser file uploads (digital downloads, forms, media library)
  app.use("/api/media-upload", mediaUploadRouter);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
