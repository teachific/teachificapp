import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(url);
console.log("Connected to database");

try {
  await conn.execute(
    "ALTER TABLE `platform_settings` ADD COLUMN IF NOT EXISTS `termsOfService` TEXT"
  );
  console.log("✓ Added termsOfService column");
} catch (e) {
  if (e.code === "ER_DUP_FIELDNAME") {
    console.log("termsOfService column already exists, skipping");
  } else throw e;
}

try {
  await conn.execute(
    "ALTER TABLE `platform_settings` ADD COLUMN IF NOT EXISTS `privacyPolicy` TEXT"
  );
  console.log("✓ Added privacyPolicy column");
} catch (e) {
  if (e.code === "ER_DUP_FIELDNAME") {
    console.log("privacyPolicy column already exists, skipping");
  } else throw e;
}

await conn.end();
console.log("Migration complete");
