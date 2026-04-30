/**
 * ensureAppVersions — idempotent startup seed for desktop app download URLs.
 *
 * Called once on server startup (non-blocking). Inserts or updates the three
 * Teachific desktop app entries in `app_versions` so the Platform Admin page
 * and the public download pages always show the correct S3 URLs without any
 * manual data entry.
 *
 * To release a new version:
 *   1. Build the new installer and upload the .zip to S3.
 *   2. Update the `version` and `windowsUrl` (or `macUrl`) fields below.
 *   3. Deploy — the seed runs automatically on the next server start.
 */

import { getDb } from "./db";
import { appVersions } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

interface AppVersionSeed {
  product: "creator" | "studio" | "quizcreator";
  version: string;
  windowsUrl: string | null;
  macUrl: string | null;
  releaseNotes: string | null;
}

// ─── Update these entries when releasing a new version ───────────────────────
const SEEDS: AppVersionSeed[] = [
  {
    product: "creator",
    version: "1.0.0",
    windowsUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663401463434/fJXMsdmk8vcb8V4GDt37f6/TeachificCreator-Setup-1.0.0_df7323d9.zip",
    macUrl: null,
    releaseNotes: "Initial release of TeachificCreator™ for Windows. Includes course authoring, built-in QuizMaker, screen recording, SCORM/HTML5/xAPI export, and Teachific icon.",
  },
  {
    product: "studio",
    version: "1.0.0",
    windowsUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663401463434/fJXMsdmk8vcb8V4GDt37f6/TeachificStudio-Setup-1.0.0_bf3ea6b0.zip",
    macUrl: null,
    releaseNotes: "Initial release of Teachific Studio™ for Windows. Screen recording, transcription editing, AI highlight clips, MP4 export, and Teachific icon.",
  },
  {
    product: "quizcreator",
    version: "1.0.0",
    windowsUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663401463434/fJXMsdmk8vcb8V4GDt37f6/TeachificQuizCreator-Setup-1.0.0_0bab2180.zip",
    macUrl: null,
    releaseNotes: "Initial release of Teachific QuizCreator™ for Windows. Full iSpring QuizMaker-equivalent with SCORM, HTML5, xAPI, Excel/Word export, and Teachific icon.",
  },
];
// ─────────────────────────────────────────────────────────────────────────────

export async function ensureAppVersions(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  for (const seed of SEEDS) {
    // Check if this exact product + version already exists
    const [existing] = await db
      .select()
      .from(appVersions)
      .where(
        and(
          eq(appVersions.product, seed.product),
          eq(appVersions.version, seed.version)
        )
      )
      .limit(1);

    if (existing) {
      // Update URLs in case they changed (e.g. CDN migration)
      await db
        .update(appVersions)
        .set({
          windowsUrl: seed.windowsUrl,
          macUrl: seed.macUrl,
          releaseNotes: seed.releaseNotes,
          isLatest: true,
        })
        .where(eq(appVersions.id, existing.id));
    } else {
      // Mark all previous versions for this product as not-latest
      await db
        .update(appVersions)
        .set({ isLatest: false })
        .where(eq(appVersions.product, seed.product));

      // Insert the new version as latest
      await db.insert(appVersions).values({
        product: seed.product,
        version: seed.version,
        windowsUrl: seed.windowsUrl,
        macUrl: seed.macUrl,
        releaseNotes: seed.releaseNotes,
        isLatest: true,
      });
    }
  }

  console.log("[AppVersions] Seed complete — all 3 products up to date.");
}
