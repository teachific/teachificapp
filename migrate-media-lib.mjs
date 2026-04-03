import mysql from "mysql2/promise";
import { readFileSync } from "fs";

const sql = readFileSync("/home/ubuntu/scorm-host/drizzle/0027_busy_living_lightning.sql", "utf8");

const conn = await mysql.createConnection(process.env.DATABASE_URL);
try {
  for (const stmt of sql.split(";").map(s => s.trim()).filter(Boolean)) {
    await conn.execute(stmt);
    console.log("✓", stmt.slice(0, 60));
  }
  console.log("Migration complete.");
} catch (e) {
  console.error("Migration error:", e.message);
} finally {
  await conn.end();
}
