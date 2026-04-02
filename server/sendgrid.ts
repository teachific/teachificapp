import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY ?? "";
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? "hello@teachific.net";
const FROM_NAME = process.env.SENDGRID_FROM_NAME ?? "Teachific";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn("[SendGrid] No API key configured — email not sent:", opts.subject);
    return false;
  }
  try {
    await sgMail.send({
      to: opts.to,
      from: {
        email: opts.fromEmail ?? FROM_EMAIL,
        name: opts.fromName ?? FROM_NAME,
      },
      subject: opts.subject,
      html: opts.html,
      text: opts.text ?? opts.html.replace(/<[^>]+>/g, ""),
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    });
    return true;
  } catch (err: any) {
    console.error("[SendGrid] Send failed:", err?.response?.body ?? err);
    return false;
  }
}

/** Replace merge tags in a template string.
 *  Supported tags: {{user_name}}, {{org_name}}, {{course_title}},
 *  {{unsubscribe_url}}, {{site_url}}, {{year}}
 */
export function resolveMergeTags(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

/** Build an unsubscribe token: base64url(orgId:userId:timestamp) */
export function buildUnsubscribeToken(orgId: number, userId: number): string {
  const payload = `${orgId}:${userId}:${Date.now()}`;
  return Buffer.from(payload).toString("base64url");
}

/** Parse an unsubscribe token back to { orgId, userId } */
export function parseUnsubscribeToken(
  token: string
): { orgId: number; userId: number } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length < 2) return null;
    const orgId = parseInt(parts[0]);
    const userId = parseInt(parts[1]);
    if (isNaN(orgId) || isNaN(userId)) return null;
    return { orgId, userId };
  } catch {
    return null;
  }
}

/** Validate SendGrid API key by calling the API */
export async function validateSendGridKey(): Promise<boolean> {
  if (!SENDGRID_API_KEY) return false;
  try {
    const res = await fetch("https://api.sendgrid.com/v3/user/profile", {
      headers: { Authorization: `Bearer ${SENDGRID_API_KEY}` },
    });
    return res.status === 200;
  } catch {
    return false;
  }
}
