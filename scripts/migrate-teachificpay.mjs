import { createConnection } from "mysql2/promise";
import { config } from "dotenv";
config();

const db = await createConnection(process.env.DATABASE_URL);

const statements = [
  "ALTER TABLE `organizations` ADD COLUMN IF NOT EXISTS `stripeConnectAccountId` varchar(255)",
  "ALTER TABLE `organizations` ADD COLUMN IF NOT EXISTS `stripeConnectStatus` enum('not_connected','pending','active','restricted','suspended') DEFAULT 'not_connected' NOT NULL",
  "ALTER TABLE `organizations` ADD COLUMN IF NOT EXISTS `paymentGateway` enum('teachific_pay','own_gateway') DEFAULT 'teachific_pay' NOT NULL",
  "ALTER TABLE `organizations` ADD COLUMN IF NOT EXISTS `ownStripePublishableKey` varchar(255)",
  "ALTER TABLE `organizations` ADD COLUMN IF NOT EXISTS `ownStripeSecretKeyEncrypted` text",
  "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `creatorRole` enum('none','starter','pro','team') DEFAULT 'none' NOT NULL",
];

for (const sql of statements) {
  try {
    await db.execute(sql);
    console.log("✓", sql.substring(0, 80));
  } catch (e) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log("⚠ Already exists:", sql.substring(0, 80));
    } else {
      console.error("✗", e.message, sql.substring(0, 80));
    }
  }
}

await db.end();
console.log("Migration complete.");
