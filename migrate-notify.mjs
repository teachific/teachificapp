import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const sqls = [
  "ALTER TABLE `forms` ADD COLUMN IF NOT EXISTS `notifyOrgAdmin` boolean DEFAULT false NOT NULL",
  "ALTER TABLE `forms` ADD COLUMN IF NOT EXISTS `notifyRespondent` boolean DEFAULT false NOT NULL",
];
for (const sql of sqls) {
  try {
    await conn.execute(sql);
    console.log("OK:", sql.slice(0, 60));
  } catch (e) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log("Already exists, skipping:", sql.slice(0, 60));
    } else {
      console.error("Error:", e.message);
    }
  }
}
await conn.end();
console.log("Done.");
