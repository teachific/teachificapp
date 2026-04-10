/**
 * embedToken.ts
 * Issues and verifies short-lived signed JWTs for cookie-free embed/player access.
 *
 * These tokens are passed as ?t=<token> in the iframe src URL so that embedded
 * content can call tRPC session procedures without needing a session cookie.
 * This is required because browsers block SameSite=None cookies in cross-origin
 * iframes (hospital firewalls, Safari ITP, Firefox strict ETP).
 *
 * Token payload:
 *   - packageId: number       — which package this token grants access to
 *   - userId?: number         — authenticated user id (if logged in)
 *   - orgId?: number          — org context
 *   - learnerName?: string    — anonymous learner name from URL params
 *   - learnerEmail?: string   — anonymous learner email from URL params
 *   - learnerId?: string      — anonymous learner id from URL params
 *   - learnerGroup?: string   — anonymous learner group from URL params
 *   - customData?: string     — custom data from URL params
 *   - utmSource?: string
 *   - utmMedium?: string
 *   - utmCampaign?: string
 *   - referrer?: string
 *   - iat, exp                — issued at / expiry (24h)
 */
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./_core/env";

const EMBED_TOKEN_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const EMBED_TOKEN_ISSUER = "teachific-embed";

export interface EmbedTokenPayload {
  packageId: number;
  userId?: number;
  orgId?: number;
  learnerName?: string;
  learnerEmail?: string;
  learnerId?: string;
  learnerGroup?: string;
  customData?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
}

function getSecretKey() {
  const secret = ENV.cookieSecret;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return new TextEncoder().encode(secret + ":embed");
}

/**
 * Issue a signed embed token for a given package and optional learner context.
 */
export async function issueEmbedToken(payload: EmbedTokenPayload): Promise<string> {
  const key = getSecretKey();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(EMBED_TOKEN_ISSUER)
    .setExpirationTime(`${EMBED_TOKEN_TTL_SECONDS}s`)
    .sign(key);
}

/**
 * Verify and decode an embed token. Returns the payload or null if invalid/expired.
 */
export async function verifyEmbedToken(token: string): Promise<EmbedTokenPayload | null> {
  try {
    const key = getSecretKey();
    const { payload } = await jwtVerify(token, key, { issuer: EMBED_TOKEN_ISSUER });
    return payload as unknown as EmbedTokenPayload;
  } catch {
    return null;
  }
}
