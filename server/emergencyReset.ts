/**
 * TEMPORARY EMERGENCY RESET ENDPOINT
 * This file is ONLY for emergency admin password reset.
 * It MUST be removed after use.
 *
 * Endpoint: POST /api/emergency-reset
 * Body: { secret: string, email: string, newPassword: string }
 *
 * The secret is checked against EMERGENCY_RESET_SECRET env var.
 */
import { Router } from "express";
import bcrypt from "bcryptjs";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/", async (req, res) => {
  const { secret, email, newPassword, listUsers } = req.body;

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

    // List users mode
    if (listUsers) {
      const allUsers = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          emailVerified: users.emailVerified,
        })
        .from(users)
        .limit(50);
      return res.json({ users: allUsers });
    }

    // Reset password mode
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
      })
      .where(eq(users.id, user.id));

    return res.json({
      success: true,
      message: `Password reset for ${email} (id=${user.id}, role=${user.role})`,
    });
  } catch (err: any) {
    console.error("[EmergencyReset] Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
