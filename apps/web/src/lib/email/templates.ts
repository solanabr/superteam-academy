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

// ─────────────────────────────────────────────────────────────────────────────
// Session-plan reminder (#869)
// ─────────────────────────────────────────────────────────────────────────────

/** Locales this template renders. Mirrors `lib/i18n/config` without importing it. */
export type EmailLocale = "en" | "pt-BR" | "es";

export interface SessionPlanReminderParams {
  /** Unknown/absent locale falls back to `en`. */
  locale: string | null;
  /** The committed time ("19:00"), or "" when none was stored. */
  planTime: string;
  /** Absolute link back into the app (the learner's continue point). */
  dashboardUrl: string;
  /** REQUIRED — per-recipient one-click link that clears REMINDER consent only. */
  unsubscribeUrl: string;
}

interface ReminderCopy {
  subjectWithTime: (time: string) => string;
  subjectNoTime: string;
  eyebrow: string;
  headingWithTime: (time: string) => string;
  headingNoTime: string;
  body: string;
  cta: string;
  footer: string;
  unsubscribe: string;
}

/**
 * Copy for the three shipped locales. Kept as data (not next-intl) because the
 * send runs from a cron with no request context and therefore no locale
 * negotiation — the recipient's locale comes from their recorded consent row.
 */
const REMINDER_COPY: Record<EmailLocale, ReminderCopy> = {
  en: {
    subjectWithTime: (t) => `Your next lesson is planned for today at ${t}`,
    subjectNoTime: "Your next lesson is planned for today",
    eyebrow: "Your plan",
    headingWithTime: (t) => `Today at ${t} is your lesson`,
    headingNoTime: "Today is your lesson",
    body: "You picked this day yourself. Fifteen minutes is enough to keep the streak alive and pick up where you left off.",
    cta: "Continue learning",
    footer:
      "You're receiving this because you asked for a reminder on your planned study day.",
    unsubscribe: "Stop these reminders",
  },
  "pt-BR": {
    subjectWithTime: (t) => `Sua próxima lição está marcada para hoje às ${t}`,
    subjectNoTime: "Sua próxima lição está marcada para hoje",
    eyebrow: "Seu plano",
    headingWithTime: (t) => `Hoje às ${t} é sua lição`,
    headingNoTime: "Hoje é sua lição",
    body: "Você mesmo escolheu este dia. Quinze minutos já bastam para manter a sequência e continuar de onde parou.",
    cta: "Continuar estudando",
    footer:
      "Você recebe este e-mail porque pediu um lembrete no dia que planejou estudar.",
    unsubscribe: "Parar estes lembretes",
  },
  es: {
    subjectWithTime: (t) =>
      `Tu próxima lección está planeada para hoy a las ${t}`,
    subjectNoTime: "Tu próxima lección está planeada para hoy",
    eyebrow: "Tu plan",
    headingWithTime: (t) => `Hoy a las ${t} es tu lección`,
    headingNoTime: "Hoy es tu lección",
    body: "Tú mismo elegiste este día. Con quince minutos alcanza para mantener la racha y seguir donde lo dejaste.",
    cta: "Seguir aprendiendo",
    footer:
      "Recibes este correo porque pediste un recordatorio el día que planeaste estudiar.",
    unsubscribe: "Dejar de recibir recordatorios",
  },
};

function reminderCopy(locale: string | null): ReminderCopy {
  const key = (locale ?? "") as EmailLocale;
  return REMINDER_COPY[key] ?? REMINDER_COPY.en;
}

/** `19:00` only. Anything else is treated as "no time" — see below. */
const PLAN_TIME_RE = /^\d{2}:\d{2}$/;

/**
 * "Your next lesson is planned for today" (#869).
 *
 * SECURITY: `planTime` comes from `profiles.prefs`, which learners write
 * THEMSELVES (own-row RLS, bounded only by shape/size CHECKs) — so it is
 * attacker-controlled text, not a trusted constant. It is (1) shape-validated
 * against `PLAN_TIME_RE` and dropped if it doesn't match, and (2) still passed
 * through {@link scrubHeaderValue} on its way into the subject, so no CR/LF can
 * reach the header line even if the shape check is ever loosened (#812).
 */
export function sessionPlanReminderEmail(
  params: SessionPlanReminderParams
): RenderedEmail {
  const copy = reminderCopy(params.locale);
  const time = PLAN_TIME_RE.test(params.planTime) ? params.planTime : "";
  const subject = scrubHeaderValue(
    time ? copy.subjectWithTime(time) : copy.subjectNoTime
  );
  const heading = time ? copy.headingWithTime(time) : copy.headingNoTime;
  const dashboardUrl = escapeHtml(params.dashboardUrl);
  const unsubscribeUrl = escapeHtml(params.unsubscribeUrl);

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr><td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6366f1;">${escapeHtml(copy.eyebrow)}</p>
            <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#18181b;">${escapeHtml(heading)}</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3f3f46;">${escapeHtml(copy.body)}</p>
            <a href="${dashboardUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px;">${escapeHtml(copy.cta)}</a>
          </td></tr>
          <tr><td style="padding:20px 32px;border-top:1px solid #e4e4e7;">
            <p style="margin:0;font-size:12px;line-height:1.6;color:#a1a1aa;">
              ${escapeHtml(copy.footer)}
              <a href="${unsubscribeUrl}" style="color:#71717a;text-decoration:underline;">${escapeHtml(copy.unsubscribe)}</a>.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = [
    subject,
    "",
    copy.body,
    params.dashboardUrl,
    "",
    "—",
    copy.footer,
    `${copy.unsubscribe}: ${params.unsubscribeUrl}`,
  ].join("\n");

  return { subject, html, text };
}
