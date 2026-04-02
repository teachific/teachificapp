import { createConnection } from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await createConnection(url);

const statements = [
  "ALTER TABLE `course_lessons` ADD COLUMN IF NOT EXISTS `isPrerequisite` boolean DEFAULT false NOT NULL",
  "ALTER TABLE `course_lessons` ADD COLUMN IF NOT EXISTS `requiresCompletion` boolean DEFAULT true NOT NULL",
  "ALTER TABLE `course_lessons` ADD COLUMN IF NOT EXISTS `passingScore` int",
  "ALTER TABLE `course_lessons` ADD COLUMN IF NOT EXISTS `allowSkip` boolean DEFAULT false NOT NULL",
  "ALTER TABLE `course_lessons` ADD COLUMN IF NOT EXISTS `estimatedMinutes` int",
];

for (const sql of statements) {
  try {
    await conn.execute(sql);
    console.log("✓", sql.substring(0, 80));
  } catch (err) {
    if (err.code === "ER_DUP_FIELDNAME") {
      console.log("⚠ already exists:", sql.substring(0, 80));
    } else {
      console.error("✗", err.message);
    }
  }
}

await conn.end();
console.log("Migration complete.");
