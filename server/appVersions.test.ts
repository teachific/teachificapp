import { describe, it, expect } from "vitest";
import { getDb } from "./db";
import { appVersions } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("app_versions table - real S3 download URLs", () => {
  it("studio has a real S3 windowsUrl", async () => {
    const db = await getDb();
    const [row] = await db
      .select()
      .from(appVersions)
      .where(and(eq(appVersions.product, "studio"), eq(appVersions.isLatest, true)))
      .limit(1);
    expect(row).toBeDefined();
    expect(row.windowsUrl).toBeTruthy();
    expect(row.windowsUrl).toContain("cloudfront.net");
    expect(row.windowsUrl).toContain(".zip");
    expect(row.version).toBe("1.1.0");
  });

  it("creator has a real S3 windowsUrl", async () => {
    const db = await getDb();
    const [row] = await db
      .select()
      .from(appVersions)
      .where(and(eq(appVersions.product, "creator"), eq(appVersions.isLatest, true)))
      .limit(1);
    expect(row).toBeDefined();
    expect(row.windowsUrl).toBeTruthy();
    expect(row.windowsUrl).toContain("cloudfront.net");
    expect(row.windowsUrl).toContain(".zip");
    expect(row.version).toBe("1.1.0");
  });

  it("quizcreator has a real S3 windowsUrl", async () => {
    const db = await getDb();
    const [row] = await db
      .select()
      .from(appVersions)
      .where(and(eq(appVersions.product, "quizcreator"), eq(appVersions.isLatest, true)))
      .limit(1);
    expect(row).toBeDefined();
    expect(row.windowsUrl).toBeTruthy();
    expect(row.windowsUrl).toContain("cloudfront.net");
    expect(row.windowsUrl).toContain(".zip");
    expect(row.version).toBe("1.1.0");
  });

  it("no product has a macUrl (macOS coming soon)", async () => {
    const db = await getDb();
    const rows = await db
      .select()
      .from(appVersions)
      .where(eq(appVersions.isLatest, true));
    for (const row of rows) {
      expect(row.macUrl).toBeNull();
    }
  });
});
