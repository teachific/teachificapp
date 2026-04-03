import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await conn.execute("ALTER TABLE `forms` ADD COLUMN IF NOT EXISTS `successMessageHtml` text");
  console.log("✓ successMessageHtml added");
} catch (e) { console.log("successMessageHtml:", e.message); }
try {
  await conn.execute("ALTER TABLE `forms` ADD COLUMN IF NOT EXISTS `showPageProgressBar` boolean DEFAULT true NOT NULL");
  console.log("✓ showPageProgressBar added");
} catch (e) { console.log("showPageProgressBar:", e.message); }
await conn.end();
console.log("Migration complete");
