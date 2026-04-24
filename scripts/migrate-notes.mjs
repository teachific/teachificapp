import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";

const sql = readFileSync(new URL("../drizzle/0071_fair_madripoor.sql", import.meta.url), "utf8");

const conn = await createConnection(process.env.DATABASE_URL);
const statements = sql.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
for (const stmt of statements) {
  try {
    await conn.execute(stmt);
    console.log("OK:", stmt.slice(0, 60));
  } catch (e) {
    if (e.code === "ER_TABLE_EXISTS_ERROR") {
      console.log("SKIP (already exists):", stmt.slice(0, 60));
    } else {
      throw e;
    }
  }
}
await conn.end();
console.log("Migration complete.");
