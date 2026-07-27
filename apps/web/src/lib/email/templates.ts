/**
 * Email templates (#769). Plain typed HTML + text builders — no React Email
 * dependency. Every marketing template MUST embed an unsubscribe link (LGPD/
 * GDPR/CAN-SPAM); the builders take `unsubscribeUrl` as a required argument so a
 * template can't be constructed without one, and the campaign additionally sets
 * the `List-Unsubscribe` header. Free of server-only imports so it's unit
 * testable in isolation.
 */

/** Minimal HTML-escape for interpolated, user-facing text (course titles). */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Strip CR/LF from a value bound into an email SUBJECT (a mail header line).
 * Resend's JSON API already blocks raw header injection, but the subject
 * interpolates a user-controlled course title, so we neutralize newlines at the
 * boundary as defense-in-depth (#807): they can never split the header line or
 * smuggle an extra one, regardless of the transport underneath.
 */
function scrubHeaderValue(s: string): string {
  return s.replace(/[\r\n]/g, " ");
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface NewCourseEmailParams {
  courseTitle: string;
  courseUrl: string;
  /** REQUIRED — the per-recipient one-click unsubscribe link. */
  unsubscribeUrl: string;
}

/**
 * "A new course is available" announcement. The unsubscribe link is rendered in
 * both the HTML footer and the plain-text body.
 */
export function newCourseAnnouncementEmail(
  params: NewCourseEmailParams
): RenderedEmail {
  const title = escapeHtml(params.courseTitle);
  const courseUrl = escapeHtml(params.courseUrl);
  const unsubscribeUrl = escapeHtml(params.unsubscribeUrl);
  const subject = scrubHeaderValue(
    `New course on Superteam Academy: ${params.courseTitle}`
  );

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr><td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6366f1;">New course</p>
            <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#18181b;">${title}</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3f3f46;">A new course just went live on Superteam Academy. Jump in and start earning XP.</p>
            <a href="${courseUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px;">Start the course</a>
          </td></tr>
          <tr><td style="padding:20px 32px;border-top:1px solid #e4e4e7;">
            <p style="margin:0;font-size:12px;line-height:1.6;color:#a1a1aa;">
              You're receiving this because you opted in to product news from Superteam Academy.
              <a href="${unsubscribeUrl}" style="color:#71717a;text-decoration:underline;">Unsubscribe</a>.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = [
    `New course on Superteam Academy: ${params.courseTitle}`,
    "",
    "A new course just went live. Start learning:",
    params.courseUrl,
    "",
    "—",
    "You opted in to product news from Superteam Academy.",
    `Unsubscribe: ${params.unsubscribeUrl}`,
  ].join("\n");

  return { subject, html, text };
}
