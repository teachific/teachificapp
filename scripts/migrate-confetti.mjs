import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("No DATABASE_URL");
  process.exit(1);
}

const conn = await mysql.createConnection(url);

const statements = [
  "ALTER TABLE `course_lessons` ADD `startBannerCustomSoundUrl` text",
  "ALTER TABLE `course_lessons` ADD `startBannerConfetti` boolean DEFAULT false NOT NULL",
  "ALTER TABLE `course_lessons` ADD `startBannerConfettiStyle` enum('burst','cannon','rain','fireworks') DEFAULT 'burst'",
  "ALTER TABLE `course_lessons` ADD `completeBannerCustomSoundUrl` text",
  "ALTER TABLE `course_lessons` ADD `completeBannerConfetti` boolean DEFAULT false NOT NULL",
  "ALTER TABLE `course_lessons` ADD `completeBannerConfettiStyle` enum('burst','cannon','rain','fireworks') DEFAULT 'burst'",
];

for (const sql of statements) {
  try {
    await conn.execute(sql);
    console.log("✓", sql.slice(0, 60));
  } catch (err) {
    if (err.code === "ER_DUP_FIELDNAME") {
      console.log("⚠ Already exists, skipping:", sql.slice(0, 60));
    } else {
      console.error("✗ Error:", err.message);
    }
  }
}

await conn.end();
console.log("Migration complete.");
