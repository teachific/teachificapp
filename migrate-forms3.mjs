import mysql from "mysql2/promise";
import { readFileSync } from "fs";

const raw = readFileSync("/home/ubuntu/scorm-host/drizzle/0028_chilly_tenebrous.sql", "utf8");

// Remove Drizzle-specific comment lines before splitting
// Also convert CREATE TABLE to CREATE TABLE IF NOT EXISTS to be idempotent
const sql = raw
  .replace(/--> statement-breakpoint/g, "")
  .replace(/CREATE TABLE (`[^`]+`)/g, "CREATE TABLE IF NOT EXISTS $1");

const conn = await mysql.createConnection(process.env.DATABASE_URL);
try {
  for (const stmt of sql.split(";").map(s => s.trim()).filter(Boolean)) {
    await conn.execute(stmt);
    console.log("✓", stmt.slice(0, 80));
  }
  console.log("Migration complete.");
} catch (e) {
  console.error("Migration error:", e.message);
  process.exit(1);
} finally {
  await conn.end();
}
