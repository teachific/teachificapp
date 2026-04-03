import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";

const sql = readFileSync("./drizzle/0026_fantastic_wendigo.sql", "utf8");
const statements = sql.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);

const conn = await createConnection(process.env.DATABASE_URL);
for (const stmt of statements) {
  try {
    await conn.execute(stmt);
    console.log("OK:", stmt.slice(0, 80).replace(/\n/g, " "));
  } catch (e) {
    if (e.code === "ER_TABLE_EXISTS_ERROR" || e.code === "ER_DUP_FIELDNAME") {
      console.log("SKIP (already exists):", stmt.slice(0, 60));
    } else {
      console.error("ERR:", e.message, "\n  SQL:", stmt.slice(0, 80));
    }
  }
}
await conn.end();
console.log("Migration complete.");
