/**
 * chunkedMediaUpload — splits a file into 5 MB chunks and uploads via
 * /api/chunked/media/* to bypass proxy timeout on large video/audio files.
 *
 * Returns the S3 URL of the uploaded file.
 */
export interface ChunkedMediaUploadOptions {
  file: File;
  orgId: number;
  folder?: string;
  contentType?: string;
  /** Called with 0–100 progress percentage as chunks are sent */
  onProgress?: (pct: number) => void;
}

export async function chunkedMediaUpload({
  file,
  orgId,
  folder,
  contentType,
  onProgress,
}: ChunkedMediaUploadOptions): Promise<{ url: string; key: string; fileName: string; fileSize: number }> {
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const resolvedFolder = folder ?? (file.type.startsWith("video/") ? "lms-video" : "lms-media");
  const resolvedContentType = contentType ?? file.type ?? "application/octet-stream";

  // 1. Initiate upload session
  const initRes = await fetch("/api/chunked/media/initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      totalChunks,
      filename: file.name,
      totalBytes: file.size,
      orgId,
      folder: resolvedFolder,
      contentType: resolvedContentType,
    }),
  });
  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? "Failed to initiate upload");
  }
  const { uploadId } = await initRes.json() as { uploadId: string };

  // 2. Upload each chunk sequentially
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunkForm = new FormData();
    chunkForm.append("chunk", file.slice(start, end), file.name);
    chunkForm.append("chunkIndex", String(i));
    const chunkRes = await fetch(`/api/chunked/media/chunk/${uploadId}`, {
      method: "POST",
      credentials: "include",
      body: chunkForm,
    });
    if (!chunkRes.ok) {
      const err = await chunkRes.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error ?? `Chunk ${i} upload failed`);
    }
    onProgress?.(Math.round(((i + 1) / totalChunks) * 100));
  }

  // 3. Finalize — server assembles and stores to S3
  const finalRes = await fetch(`/api/chunked/media/finalize/${uploadId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({}),
  });
  if (!finalRes.ok) {
    const err = await finalRes.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? "Finalize failed");
  }
  return finalRes.json() as Promise<{ url: string; key: string; fileName: string; fileSize: number }>;
}
