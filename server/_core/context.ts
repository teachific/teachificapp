import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getUserById } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: (User & { impersonatedBy?: string }) | null;
};

/** Parse a single named cookie from the Cookie header */
function parseCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Resolve a user from the custom Teachific email/password session cookie */
async function resolveTeachificSession(cookieHeader: string | undefined): Promise<User | null> {
  try {
    const raw = parseCookie(cookieHeader, "teachific_session");
    if (!raw) return null;
    const payload = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (!payload?.userId || typeof payload.userId !== "number") return null;
    const user = await getUserById(payload.userId);
    return user ?? null;
  } catch {
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: (User & { impersonatedBy?: string }) | null = null;

  try {
    // Primary: Manus OAuth / app_session_id cookie
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    // Fallback: custom Teachific email/password session cookie
    user = await resolveTeachificSession(opts.req.headers.cookie);
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
