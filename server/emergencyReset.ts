/**
 * TEMPORARY EMERGENCY RESET ENDPOINT
 * This file is ONLY for emergency admin password reset.
 * It MUST be removed after use.
 *
 * Endpoint: POST /api/emergency-reset
 * Body: { secret: string, action: "list"|"reset"|"create", email?: string, newPassword?: string, name?: string }
 *
 * The secret is checked against EMERGENCY_RESET_SECRET env var.
 */
import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getDb } from "./db";
import { users, platformSettings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const router = Router();

function generateOpenId(): string {
  return `local_${crypto.randomUUID().replace(/-/g, "")}`;
}

router.post("/", async (req, res) => {
  const { secret, action, email, newPassword, name } = req.body;

  // Verify secret
  const expectedSecret = process.env.EMERGENCY_RESET_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return res.status(403).json({ error: "Invalid secret" });
  }

  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // List users
    if (action === "list") {
      const allUsers = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          emailVerified: users.emailVerified,
          loginMethod: users.loginMethod,
        })
        .from(users)
        .limit(50);
      return res.json({ users: allUsers });
    }

    // Create first admin user
    if (action === "create") {
      if (!email || !newPassword) {
        return res.status(400).json({ error: "email and newPassword required" });
      }

      // Check if user already exists
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (existing) {
        return res.status(409).json({ error: `User already exists: ${email}` });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      const openId = generateOpenId();

      await db.insert(users).values({
        openId,
        name: name || "Admin",
        email: email.toLowerCase(),
        loginMethod: "email",
        role: "site_owner",
        passwordHash,
        emailVerified: true,
      });

      // Also ensure platform_settings row exists
      const [settings] = await db.select().from(platformSettings).where(eq(platformSettings.id, 1)).limit(1);
      if (!settings) {
        await db.insert(platformSettings).values({ id: 1 });
      }

      return res.json({
        success: true,
        message: `Admin user created: ${email} with role=site_owner`,
      });
    }

    // Reset password
    if (action === "reset") {
      if (!email || !newPassword) {
        return res.status(400).json({ error: "email and newPassword required" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: `User not found: ${email}` });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await db
        .update(users)
        .set({
          passwordHash,
          emailVerified: true,
          resetToken: null,
          resetTokenExpiry: null,
          role: "site_owner",
        })
        .where(eq(users.id, user.id));

      return res.json({
        success: true,
        message: `Password reset for ${email} (id=${user.id}, role=site_owner)`,
      });
    }

    return res.status(400).json({ error: "Invalid action. Use: list, create, or reset" });
  } catch (err: any) {
    console.error("[EmergencyReset] Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
