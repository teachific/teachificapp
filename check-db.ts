import { getDb } from "./server/db";
import { appVersions } from "./drizzle/schema";
import { desc } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) { console.log("No DB"); process.exit(1); }
  const rows = await db.select().from(appVersions).orderBy(desc(appVersions.createdAt));
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
