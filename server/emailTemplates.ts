/**
 * Teachific™ Branded Email Templates
 *
 * All transactional emails use a consistent branded layout:
 * - Teal (#189aa1) header with Teachific™ wordmark
 * - Clean white body with readable typography
 * - Teal CTA buttons
 * - Footer with copyright and contact info
 */

const SITE_URL = process.env.VITE_SITE_URL ?? "https://teachific.app";
const YEAR = new Date().getFullYear();

// ─── Base Layout ─────────────────────────────────────────────────────────────

function emailLayout(opts: {
  preheader?: string;
  title: string;
  body: string;
  footerNote?: string;
}): string {
  const preheaderHtml = opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${opts.preheader}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${opts.title}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  ${preheaderHtml}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f4f8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#189aa1 0%,#0e8a96 100%);border-radius:12px 12px 0 0;padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;line-height:1;">teach</span><span style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#4ad9e0;line-height:1;">ific</span><span style="font-size:14px;font-weight:700;color:#ffffff;vertical-align:super;margin-left:1px;">™</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-left:1px solid #e8edf2;border-right:1px solid #e8edf2;">
              ${opts.body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border:1px solid #e8edf2;border-top:none;border-radius:0 0 12px 12px;padding:20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:12px;color:#94a3b8;line-height:1.6;">
                    ${opts.footerNote ? `<p style="margin:0 0 8px;">${opts.footerNote}</p>` : ""}
                    <p style="margin:0;">© ${YEAR} Teachific™ · <a href="${SITE_URL}" style="color:#189aa1;text-decoration:none;">${SITE_URL.replace("https://", "")}</a> · <a href="mailto:hello@teachific.net" style="color:#189aa1;text-decoration:none;">hello@teachific.net</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── CTA Button ──────────────────────────────────────────────────────────────

function ctaButton(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
    <tr>
      <td style="border-radius:8px;background:#189aa1;">
        <a href="${url}" style="display:inline-block;padding:14px 32px;background:#189aa1;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;border-radius:8px;letter-spacing:0.1px;">${text}</a>
      </td>
    </tr>
  </table>`;
}

function infoBox(content: string): string {
  return `<div style="background:#f0fafa;border:1px solid #b2e0e3;border-radius:8px;padding:16px 20px;margin:20px 0;font-size:13px;color:#0e6b72;line-height:1.6;">${content}</div>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e8edf2;margin:28px 0;" />`;
}

// ─── Template: Email Verification ────────────────────────────────────────────

export function verifyEmailHtml(name: string, verifyUrl: string): string {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Verify your email address</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">Hi ${name || "there"},</p>
    <p style="margin:0 0 4px;font-size:15px;color:#475569;line-height:1.7;">Thanks for signing up for Teachific™! Please verify your email address to activate your account and start building your online school.</p>
    ${ctaButton("Verify Email Address", verifyUrl)}
    ${infoBox("This link expires in <strong>24 hours</strong>. If you didn't create a Teachific account, you can safely ignore this email.")}
    ${divider()}
    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">Can't click the button? Copy and paste this link into your browser:<br/><a href="${verifyUrl}" style="color:#189aa1;word-break:break-all;">${verifyUrl}</a></p>
  `;
  return emailLayout({
    preheader: "Verify your email to activate your Teachific account.",
    title: "Verify your email — Teachific™",
    body,
    footerNote: "You're receiving this email because you created a Teachific account.",
  });
}

// ─── Template: Password Reset ─────────────────────────────────────────────────

export function resetPasswordHtml(name: string, resetUrl: string): string {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Reset your password</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">Hi ${name || "there"},</p>
    <p style="margin:0 0 4px;font-size:15px;color:#475569;line-height:1.7;">We received a request to reset the password for your Teachific account. Click the button below to choose a new password.</p>
    ${ctaButton("Reset Password", resetUrl)}
    ${infoBox("This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your password will not be changed.")}
    ${divider()}
    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">Can't click the button? Copy and paste this link into your browser:<br/><a href="${resetUrl}" style="color:#189aa1;word-break:break-all;">${resetUrl}</a></p>
  `;
  return emailLayout({
    preheader: "Reset your Teachific password — link expires in 1 hour.",
    title: "Reset your password — Teachific™",
    body,
    footerNote: "You're receiving this email because a password reset was requested for your account.",
  });
}

// ─── Template: Welcome (post-verification) ───────────────────────────────────

export function welcomeEmailHtml(name: string, dashboardUrl: string = `${SITE_URL}/lms`): string {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Welcome to Teachific™! 🎉</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">Hi ${name || "there"},</p>
    <p style="margin:0 0 4px;font-size:15px;color:#475569;line-height:1.7;">Your account is verified and ready to go. Teachific gives you everything you need to build, sell, and deliver world-class online courses — without the technical headaches.</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
      <tr>
        <td style="padding:12px 16px;background:#f8fafc;border:1px solid #e8edf2;border-radius:8px;font-size:14px;color:#475569;line-height:1.6;">
          <strong style="color:#0f172a;">✓ Your school is ready</strong> — Create your first course in minutes<br/>
          <strong style="color:#0f172a;">✓ Sell your knowledge</strong> — Built-in payments via Stripe<br/>
          <strong style="color:#0f172a;">✓ Track your learners</strong> — Analytics and completion tracking included
        </td>
      </tr>
    </table>
    ${ctaButton("Go to Your Dashboard", dashboardUrl)}
    <p style="margin:0;font-size:14px;color:#64748b;line-height:1.7;">Need help getting started? Visit our <a href="${SITE_URL}/help" style="color:#189aa1;text-decoration:none;">Help Center</a> or reply to this email and we'll get back to you.</p>
  `;
  return emailLayout({
    preheader: "Your Teachific account is ready — start building your school today.",
    title: "Welcome to Teachific™",
    body,
    footerNote: "You're receiving this email because you created a Teachific account.",
  });
}

// ─── Template: Course Enrollment ─────────────────────────────────────────────

export function courseEnrollmentHtml(opts: {
  userName: string;
  orgName?: string;
  courseTitles: string[];
  loginUrl?: string;
  amountPaid?: number;
}): string {
  const { userName, orgName, courseTitles, loginUrl = `${SITE_URL}/login`, amountPaid } = opts;
  const courseListHtml = courseTitles
    .map((t) => `<li style="margin:6px 0;color:#475569;">${t}</li>`)
    .join("");
  const plural = courseTitles.length > 1;
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">You've been enrolled!</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">Hi ${userName || "there"},</p>
    ${orgName ? `<p style="margin:0 0 4px;font-size:15px;color:#475569;line-height:1.7;"><strong>${orgName}</strong> has enrolled you in the following course${plural ? "s" : ""}:</p>` : `<p style="margin:0 0 4px;font-size:15px;color:#475569;line-height:1.7;">You have been enrolled in the following course${plural ? "s" : ""}:</p>`}
    <ul style="margin:16px 0;padding-left:20px;font-size:15px;line-height:1.7;">${courseListHtml}</ul>
    ${amountPaid ? `<p style="margin:0 0 16px;font-size:14px;color:#64748b;">Amount paid: <strong>$${amountPaid.toFixed(2)}</strong></p>` : ""}
    <p style="margin:0 0 4px;font-size:15px;color:#475569;line-height:1.7;">Log in to your account to start learning right away.</p>
    ${ctaButton("Start Learning", loginUrl)}
    ${divider()}
    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">${orgName ? `This enrollment was managed by ${orgName} via Teachific™.` : "Powered by Teachific™."}</p>
  `;
  return emailLayout({
    preheader: `You've been enrolled in ${plural ? `${courseTitles.length} courses` : courseTitles[0]}${orgName ? ` at ${orgName}` : ""}.`,
    title: `Course enrollment${orgName ? ` — ${orgName}` : ""}`,
    body,
    footerNote: orgName ? `This email was sent on behalf of ${orgName}.` : undefined,
  });
}

// ─── Template: Purchase Confirmation ─────────────────────────────────────────

export function purchaseConfirmationHtml(opts: {
  userName: string;
  courseTitle: string;
  amountPaid: number;
  loginUrl?: string;
}): string {
  const { userName, courseTitle, amountPaid, loginUrl = `${SITE_URL}/login` } = opts;
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Payment confirmed! 🎓</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">Hi ${userName || "there"},</p>
    <p style="margin:0 0 4px;font-size:15px;color:#475569;line-height:1.7;">Your payment was successful and you now have full access to:</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr>
        <td style="padding:16px 20px;background:#f0fafa;border:1px solid #b2e0e3;border-radius:8px;">
          <p style="margin:0;font-size:16px;font-weight:600;color:#0f172a;">${courseTitle}</p>
          <p style="margin:4px 0 0;font-size:14px;color:#64748b;">Amount paid: <strong>$${amountPaid.toFixed(2)}</strong></p>
        </td>
      </tr>
    </table>
    ${ctaButton("Start Learning Now", loginUrl)}
    <p style="margin:0;font-size:14px;color:#64748b;line-height:1.7;">Questions about your purchase? Reply to this email or visit our <a href="${SITE_URL}/help" style="color:#189aa1;text-decoration:none;">Help Center</a>.</p>
  `;
  return emailLayout({
    preheader: `Payment confirmed — you now have access to ${courseTitle}.`,
    title: "Purchase confirmation — Teachific™",
    body,
    footerNote: "You're receiving this email because you made a purchase on Teachific.",
  });
}

// ─── Template: Group Manager Assignment ──────────────────────────────────────

export function groupManagerAssignmentHtml(opts: {
  managerName: string;
  groupName: string;
  orgName?: string;
  seats: number;
  portalUrl?: string;
}): string {
  const { managerName, groupName, orgName, seats, portalUrl = `${SITE_URL}/members/group-manager` } = opts;
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">You're now a Group Manager</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">Hi ${managerName || "there"},</p>
    <p style="margin:0 0 4px;font-size:15px;color:#475569;line-height:1.7;">You have been assigned as the Group Manager for <strong>${groupName}</strong>${orgName ? ` at <strong>${orgName}</strong>` : ""}.</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr>
        <td style="padding:16px 20px;background:#f0fafa;border:1px solid #b2e0e3;border-radius:8px;font-size:14px;color:#475569;line-height:1.6;">
          <strong style="color:#0f172a;">Group:</strong> ${groupName}<br/>
          ${orgName ? `<strong style="color:#0f172a;">Organization:</strong> ${orgName}<br/>` : ""}
          <strong style="color:#0f172a;">Available seats:</strong> ${seats}
        </td>
      </tr>
    </table>
    <p style="margin:0 0 4px;font-size:15px;color:#475569;line-height:1.7;">Log in to your Group Manager portal to manage members and track enrollments.</p>
    ${ctaButton("Open Group Manager Portal", portalUrl)}
  `;
  return emailLayout({
    preheader: `You've been assigned as Group Manager for ${groupName}.`,
    title: "Group Manager assignment — Teachific™",
    body,
    footerNote: `This email was sent on behalf of ${orgName ?? "your organization"} via Teachific™.`,
  });
}

// ─── Template: Email Campaign (org-sent) ─────────────────────────────────────
// Used when org admins send email campaigns to their learners.
// The html body is org-provided; we just wrap it in the branded layout.

export function campaignEmailHtml(opts: {
  orgName: string;
  bodyHtml: string;
  unsubscribeUrl?: string;
}): string {
  const { orgName, bodyHtml, unsubscribeUrl } = opts;
  const footerNote = unsubscribeUrl
    ? `This email was sent by <strong>${orgName}</strong> via Teachific™. <a href="${unsubscribeUrl}" style="color:#189aa1;">Unsubscribe</a>`
    : `This email was sent by <strong>${orgName}</strong> via Teachific™.`;
  return emailLayout({
    title: `Message from ${orgName}`,
    body: bodyHtml,
    footerNote,
  });
}
