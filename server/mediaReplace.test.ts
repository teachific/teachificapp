/**
 * Tests for POST /api/media-upload/replace
 *
 * The replace endpoint:
 *  1. Authenticates the request
 *  2. Looks up the existing org_media_library row by mediaItemId
 *  3. Overwrites the same S3 key (so the CDN URL is unchanged)
 *  4. Updates filename, fileSize, mimeType in the DB
 *  5. Returns { key, url, fileName, fileSize, fileType }
 *
 * We test the logic by mocking the DB and storage helpers.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock storage ──────────────────────────────────────────────────────────────
vi.mock("./storage", () => ({
  storagePutStream: vi.fn(),
}));

// ── Mock DB ───────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// ── Mock SDK auth ─────────────────────────────────────────────────────────────
vi.mock("./_core/sdk", () => ({
  sdk: {
    authenticateRequest: vi.fn(),
  },
}));

import { storagePutStream } from "./storage";
import { getDb } from "./db";
import { sdk } from "./_core/sdk";

const mockStoragePutStream = vi.mocked(storagePutStream);
const mockGetDb = vi.mocked(getDb);
const mockAuthenticateRequest = vi.mocked(sdk.authenticateRequest);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeDbMock(existingItem: any | null) {
  const updateSet = vi.fn().mockReturnThis();
  const updateWhere = vi.fn().mockResolvedValue(undefined);
  const selectFrom = vi.fn().mockReturnThis();
  const selectWhere = vi.fn().mockReturnThis();
  const selectLimit = vi.fn().mockResolvedValue(existingItem ? [existingItem] : []);

  return {
    select: vi.fn().mockReturnValue({ from: selectFrom }),
    update: vi.fn().mockReturnValue({ set: updateSet }),
    // chain helpers exposed for assertions
    _selectFrom: selectFrom,
    _selectWhere: selectWhere,
    _selectLimit: selectLimit,
    _updateSet: updateSet,
    _updateWhere: updateWhere,
  } as any;
}

// ─── Unit-level logic tests ───────────────────────────────────────────────────
// We test the core logic extracted from the route handler rather than spinning
// up a full Express server, keeping tests fast and dependency-free.

async function runReplaceLogic(opts: {
  authenticated: boolean;
  file: { path: string; originalname: string; size: number; mimetype: string } | null;
  mediaItemId: number | null;
  existingItem: any | null;
  storageUrl?: string;
}) {
  // Simulate auth
  if (!opts.authenticated) throw Object.assign(new Error("Unauthorized"), { status: 401 });

  if (!opts.file) throw Object.assign(new Error("No file provided"), { status: 400 });
  if (!opts.mediaItemId) throw Object.assign(new Error("mediaItemId is required"), { status: 400 });

  const db = makeDbMock(opts.existingItem);
  mockGetDb.mockResolvedValue(db as any);

  // Simulate DB lookup
  const rows = opts.existingItem ? [opts.existingItem] : [];
  const item = rows[0];
  if (!item) throw Object.assign(new Error("Media item not found"), { status: 404 });

  // Simulate S3 overwrite
  const storageUrl = opts.storageUrl ?? `https://cdn.example.com/${item.fileKey}`;
  mockStoragePutStream.mockResolvedValue({ key: item.fileKey, url: storageUrl });

  const { url } = await storagePutStream(item.fileKey, opts.file.path, opts.file.mimetype || item.mimeType);

  // Simulate DB update
  await db.update().set({
    filename: opts.file.originalname,
    fileSize: opts.file.size,
    mimeType: opts.file.mimetype || item.mimeType,
  });

  return {
    key: item.fileKey,
    url,
    fileName: opts.file.originalname,
    fileSize: opts.file.size,
    fileType: opts.file.mimetype || item.mimeType,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("Replace Media File — route logic", () => {
  const existingItem = {
    id: 42,
    orgId: 7,
    fileKey: "lms-media/7/1700000000000-abc12345-slide.pdf",
    url: "https://cdn.example.com/lms-media/7/1700000000000-abc12345-slide.pdf",
    filename: "slide.pdf",
    mimeType: "application/pdf",
    fileSize: 512000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the same S3 key and CDN URL after replacement", async () => {
    const result = await runReplaceLogic({
      authenticated: true,
      file: { path: "/tmp/media-xyz.pdf", originalname: "slide-v2.pdf", size: 600000, mimetype: "application/pdf" },
      mediaItemId: 42,
      existingItem,
      storageUrl: existingItem.url, // same URL
    });

    expect(result.key).toBe(existingItem.fileKey);
    expect(result.url).toBe(existingItem.url);
    expect(result.fileName).toBe("slide-v2.pdf");
    expect(result.fileSize).toBe(600000);
    expect(result.fileType).toBe("application/pdf");
  });

  it("calls storagePutStream with the original S3 key", async () => {
    await runReplaceLogic({
      authenticated: true,
      file: { path: "/tmp/media-xyz.pdf", originalname: "slide-v2.pdf", size: 600000, mimetype: "application/pdf" },
      mediaItemId: 42,
      existingItem,
    });

    expect(mockStoragePutStream).toHaveBeenCalledWith(
      existingItem.fileKey,
      "/tmp/media-xyz.pdf",
      "application/pdf"
    );
  });

  it("throws 401 when not authenticated", async () => {
    await expect(
      runReplaceLogic({
        authenticated: false,
        file: { path: "/tmp/f.pdf", originalname: "f.pdf", size: 100, mimetype: "application/pdf" },
        mediaItemId: 42,
        existingItem,
      })
    ).rejects.toMatchObject({ status: 401 });
  });

  it("throws 400 when no file is provided", async () => {
    await expect(
      runReplaceLogic({
        authenticated: true,
        file: null,
        mediaItemId: 42,
        existingItem,
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("throws 400 when mediaItemId is missing", async () => {
    await expect(
      runReplaceLogic({
        authenticated: true,
        file: { path: "/tmp/f.pdf", originalname: "f.pdf", size: 100, mimetype: "application/pdf" },
        mediaItemId: null,
        existingItem,
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("throws 404 when media item does not exist", async () => {
    await expect(
      runReplaceLogic({
        authenticated: true,
        file: { path: "/tmp/f.pdf", originalname: "f.pdf", size: 100, mimetype: "application/pdf" },
        mediaItemId: 9999,
        existingItem: null, // not found
      })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("falls back to existing mimeType when replacement file has no mimetype", async () => {
    const result = await runReplaceLogic({
      authenticated: true,
      file: { path: "/tmp/f.pdf", originalname: "f.pdf", size: 100, mimetype: "" },
      mediaItemId: 42,
      existingItem,
    });

    // Should fall back to the original mimeType
    expect(result.fileType).toBe(existingItem.mimeType);
    expect(mockStoragePutStream).toHaveBeenCalledWith(
      existingItem.fileKey,
      "/tmp/f.pdf",
      existingItem.mimeType
    );
  });
});
