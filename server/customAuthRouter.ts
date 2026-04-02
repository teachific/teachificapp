/**
 * Custom Teachific Authentication Router
 * Handles email/password registration, login, logout, email verification,
 * and password reset — completely independent of Manus OAuth.
 */
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "./sendgrid";
import * as dbHelpers from "./db";

const COOKIE_NAME = "teachific_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const BCRYPT_ROUNDS = 12;
const SITE_URL = process.env.VITE_SITE_URL || "https://teachific.app";

function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

function generateOpenId(): string {
  return `local_${crypto.randomUUID().replace(/-/g, "")}`;
}

function serializeCookie(name: string, value: string, maxAge: number): string {
  const isProduction = process.env.NODE_ENV === "production";
  let str = `${name}=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
  if (isProduction) str += "; Secure";
  return str;
}

// ─── Email Templates ──────────────────────────────────────────────────────────
function verifyEmailHtml(name: string, verifyUrl: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Verify your email</title></head>
<body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:40px 0;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:#189aa1;padding:32px 40px;">
      <span style="font-size:28px;font-weight:700;color:#fff;">teach</span><span style="font-size:28px;font-weight:700;color:#4ad9e0;">ific</span><span style="font-size:16px;color:#fff;">™</span>
    </div>
    <div style="padding:40px;">
      <h2 style="margin:0 0 16px;color:#111;">Verify your email address</h2>
      <p style="color:#555;line-height:1.6;">Hi ${name || "there"},</p>
      <p style="color:#555;line-height:1.6;">Thanks for signing up! Please verify your email address to activate your account.</p>
      <a href="${verifyUrl}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:#189aa1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Verify Email Address</a>
      <p style="color:#888;font-size:13px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
      <p style="color:#aaa;font-size:12px;margin-top:32px;border-top:1px solid #f0f0f0;padding-top:16px;">Teachific™ · hello@teachific.net</p>
    </div>
  </div>
</body></html>`;
}

function resetPasswordHtml(name: string, resetUrl: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Reset your password</title></head>
<body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:40px 0;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:#189aa1;padding:32px 40px;">
      <span style="font-size:28px;font-weight:700;color:#fff;">teach</span><span style="font-size:28px;font-weight:700;color:#4ad9e0;">ific</span><span style="font-size:16px;color:#fff;">™</span>
    </div>
    <div style="padding:40px;">
      <h2 style="margin:0 0 16px;color:#111;">Reset your password</h2>
      <p style="color:#555;line-height:1.6;">Hi ${name || "there"},</p>
      <p style="color:#555;line-height:1.6;">We received a request to reset your Teachific password. Click the button below to choose a new password.</p>
      <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:#189aa1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Reset Password</a>
      <p style="color:#888;font-size:13px;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
      <p style="color:#aaa;font-size:12px;margin-top:32px;border-top:1px solid #f0f0f0;padding-top:16px;">Teachific™ · hello@teachific.net</p>
    </div>
  </div>
</body></html>`;
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const customAuthRouter = router({

  /** Register a new user with email + password */
  register: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      email: z.string().email().max(320),
      password: z.string().min(8).max(128),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });

      const settings = await dbHelpers.getPlatformSettings();
      if (!settings?.allowPublicRegistration) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Public registration is currently closed." });
      }

      const existing = await db.select({ id: users.id }).from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
      }

      const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
      const verificationToken = generateToken();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const openId = generateOpenId();

      await db.insert(users).values({
        openId,
        name: input.name,
        email: input.email.toLowerCase(),
        loginMethod: "email",
        role: "user",
        passwordHash,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
        lastSignedIn: new Date(),
      });

      const [newUser] = await db.select().from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);

      if (newUser) {
        try {
          const base = (input.name || input.email).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
          const slug = `${base}-workspace-${newUser.id}`;
          await dbHelpers.createOrg({ name: `${input.name}'s Workspace`, slug, description: "Default workspace", ownerId: newUser.id });
          const org = await dbHelpers.getOrgBySlug(slug);
          if (org) await dbHelpers.addOrgMember(org.id, newUser.id, "org_admin");
        } catch {}

        const verifyUrl = `${SITE_URL}/verify-email?token=${verificationToken}`;
        await sendEmail({
          to: input.email,
          subject: "Verify your Teachific email address",
          html: verifyEmailHtml(input.name, verifyUrl),
        });
      }

      return { success: true, message: "Account created! Please check your email to verify your address." };
    }),

  /** Login with email + password */
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [user] = await db.select().from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);

      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
      }

      if (!user.emailVerified) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Please verify your email address before logging in. Check your inbox for the verification link." });
      }

      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

      const sessionToken = Buffer.from(JSON.stringify({ userId: user.id, ts: Date.now() })).toString("base64url");
      ctx.res.setHeader("Set-Cookie", serializeCookie(COOKIE_NAME, sessionToken, COOKIE_MAX_AGE));

      return {
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified },
      };
    }),

  /** Logout */
  logout: publicProcedure.mutation(async ({ ctx }) => {
    ctx.res.setHeader("Set-Cookie", serializeCookie(COOKIE_NAME, "", 0));
    return { success: true };
  }),

  /** Get current user from custom session cookie */
  me: publicProcedure.query(async ({ ctx }) => {
    try {
      const cookieHeader = ctx.req.headers.cookie ?? "";
      const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
      if (!match) return null;

      const payload = JSON.parse(Buffer.from(decodeURIComponent(match[1]), "base64url").toString("utf8"));
      if (!payload?.userId) return null;

      const db = await getDb();
      if (!db) return null;

      const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
      if (!user) return null;

      return { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified, openId: user.openId };
    } catch {
      return null;
    }
  }),

  /** Verify email with token */
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [user] = await db.select().from(users)
        .where(eq(users.emailVerificationToken, input.token))
        .limit(1);

      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired verification link." });
      if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Verification link has expired. Please request a new one." });
      }

      await db.update(users).set({ emailVerified: true, emailVerificationToken: null, emailVerificationExpiry: null }).where(eq(users.id, user.id));
      return { success: true, message: "Email verified! You can now log in." };
    }),

  /** Resend verification email */
  resendVerification: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: true };

      const [user] = await db.select().from(users).where(eq(users.email, input.email.toLowerCase())).limit(1);
      if (!user || user.emailVerified) return { success: true };

      const verificationToken = generateToken();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db.update(users).set({ emailVerificationToken: verificationToken, emailVerificationExpiry: verificationExpiry }).where(eq(users.id, user.id));

      const verifyUrl = `${SITE_URL}/verify-email?token=${verificationToken}`;
      await sendEmail({ to: input.email, subject: "Verify your Teachific email address", html: verifyEmailHtml(user.name || "", verifyUrl) });
      return { success: true };
    }),

  /** Request password reset */
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: true };

      const [user] = await db.select().from(users).where(eq(users.email, input.email.toLowerCase())).limit(1);
      if (!user || !user.passwordHash) return { success: true };

      const resetToken = generateToken();
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000);

      await db.update(users).set({ resetToken, resetTokenExpiry: resetExpiry }).where(eq(users.id, user.id));

      const resetUrl = `${SITE_URL}/reset-password?token=${resetToken}`;
      await sendEmail({ to: input.email, subject: "Reset your Teachific password", html: resetPasswordHtml(user.name || "", resetUrl) });
      return { success: true };
    }),

  /** Reset password with token */
  resetPassword: publicProcedure
    .input(z.object({ token: z.string(), newPassword: z.string().min(8).max(128) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [user] = await db.select().from(users).where(eq(users.resetToken, input.token)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired reset link." });
      if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Reset link has expired. Please request a new one." });
      }

      const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
      await db.update(users).set({ passwordHash, resetToken: null, resetTokenExpiry: null, emailVerified: true }).where(eq(users.id, user.id));
      return { success: true, message: "Password updated! You can now log in." };
    }),

  /** Change password (authenticated) */
  changePassword: protectedProcedure
    .input(z.object({ currentPassword: z.string(), newPassword: z.string().min(8).max(128) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!user?.passwordHash) throw new TRPCError({ code: "BAD_REQUEST", message: "No password set on this account." });

      const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect." });

      const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
      await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
      return { success: true };
    }),
});
