import { createConnection } from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) { console.error("No DATABASE_URL"); process.exit(1); }

const conn = await createConnection(url);

const statements = [
  "ALTER TABLE `quizzes` ADD `shareToken` varchar(32)",
  "ALTER TABLE `quizzes` ADD `publishedAt` timestamp",
  "ALTER TABLE `quizzes` ADD CONSTRAINT `quizzes_shareToken_unique` UNIQUE(`shareToken`)",
];

for (const sql of statements) {
  try {
    await conn.execute(sql);
    console.log("OK:", sql.slice(0, 60));
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_DUP_KEYNAME' || e.message.includes('Duplicate column')) {
      console.log("SKIP (already exists):", sql.slice(0, 60));
    } else {
      console.error("FAIL:", sql.slice(0, 60), e.message);
    }
  }
}

await conn.end();
console.log("Migration complete");
