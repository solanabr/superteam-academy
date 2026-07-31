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

// ─────────────────────────────────────────────────────────────────────────────
// Re-engagement set (#870, uiux-R17)
//
// CONSENT: both templates below are gated on the REMINDER consent
// (`email_subscriptions.reminder_opt_in`, unsubscribe `kind=reminders`), NOT the
// marketing one. Reasoning: LGPD consent is purpose-bound, and the purpose here
// is the learner's OWN study progress — "your streak is waiting", "one lesson
// left in the course you enrolled in". That is the same purpose the learner
// consented to when they turned on study reminders (#869); it is not product
// news, promotion, or cross-sell, which is what the marketing opt-in covers
// (#779). Gating these on marketing consent would both under-serve consenting
// learners and stretch the marketing purpose past what was consented to. The
// gate itself is enforced in SQL by the claim RPC — see the send-pipeline TODO
// in `lib/email/reengagement.ts`.
//
// TONE (research non-punitive rule): no guilt, no shaming, no "you lost", no
// countdown pressure. The learner's absence is treated as normal and their
// earned progress is stated as intact. Copy is written natively per locale, not
// translated from English.
// ─────────────────────────────────────────────────────────────────────────────

/** Footer + unsubscribe label shared by every reminder-consent email. */
interface ReminderFooterCopy {
  footer: string;
  unsubscribe: string;
}

const REENGAGEMENT_FOOTER: Record<EmailLocale, ReminderFooterCopy> = {
  en: {
    footer:
      "You're receiving this because you turned on study reminders for Superteam Academy.",
    unsubscribe: "Stop these reminders",
  },
  "pt-BR": {
    footer:
      "Você recebe este e-mail porque ativou os lembretes de estudo da Superteam Academy.",
    unsubscribe: "Parar estes lembretes",
  },
  es: {
    footer:
      "Recibes este correo porque activaste los recordatorios de estudio de Superteam Academy.",
    unsubscribe: "Dejar de recibir recordatorios",
  },
};

interface CardParams {
  eyebrow: string;
  heading: string;
  body: string;
  /** Optional second line under the body (e.g. "Next up: <lesson>"). */
  note?: string;
  ctaLabel: string;
  ctaUrl: string;
  footer: string;
  unsubscribeLabel: string;
  unsubscribeUrl: string;
}

/**
 * The shared card shell. Every interpolated value is HTML-escaped here, so a
 * caller cannot forget: the templates pass RAW strings in and get safe HTML out.
 */
function renderCard(p: CardParams): string {
  const note = p.note
    ? `<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#52525b;">${escapeHtml(p.note)}</p>`
    : "";
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr><td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6366f1;">${escapeHtml(p.eyebrow)}</p>
            <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#18181b;">${escapeHtml(p.heading)}</h1>
            <p style="margin:0 0 ${p.note ? "12px" : "24px"};font-size:15px;line-height:1.6;color:#3f3f46;">${escapeHtml(p.body)}</p>
            ${note}
            <a href="${escapeHtml(p.ctaUrl)}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px;">${escapeHtml(p.ctaLabel)}</a>
          </td></tr>
          <tr><td style="padding:20px 32px;border-top:1px solid #e4e4e7;">
            <p style="margin:0;font-size:12px;line-height:1.6;color:#a1a1aa;">
              ${escapeHtml(p.footer)}
              <a href="${escapeHtml(p.unsubscribeUrl)}" style="color:#71717a;text-decoration:underline;">${escapeHtml(p.unsubscribeLabel)}</a>.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

/**
 * Clamp a count bound into copy. Anything not a positive, finite, safely small
 * integer is dropped (returns null) rather than rendered — counts come from
 * aggregates, and a broken aggregate must not produce "your NaN-day streak".
 */
function safeCount(n: number): number | null {
  if (!Number.isInteger(n) || n <= 0 || n > 100_000) return null;
  return n;
}

// ── (a) 7-day inactivity: "come back — your progress is waiting" ─────────────

export interface ReengagementNudgeParams {
  /** Unknown/absent locale falls back to `en`. */
  locale: string | null;
  /**
   * The learner's best recorded streak, used only as a reminder of what they
   * already built. 0 (or any non-count) renders the progress-only variant —
   * we never invent a streak, and we never frame a lapsed one as a loss.
   */
  streakDays: number;
  /** Absolute link back into the app (the learner's continue point). */
  dashboardUrl: string;
  /** REQUIRED — per-recipient one-click link that clears REMINDER consent only. */
  unsubscribeUrl: string;
}

interface ReengagementCopy {
  subjectWithStreak: (n: number) => string;
  subjectNoStreak: string;
  eyebrow: string;
  headingWithStreak: (n: number) => string;
  headingNoStreak: string;
  body: string;
  cta: string;
}

const REENGAGEMENT_COPY: Record<EmailLocale, ReengagementCopy> = {
  en: {
    subjectWithStreak: (n) => `Your ${n}-day streak is waiting for you`,
    subjectNoStreak: "Your next lesson is right where you left it",
    eyebrow: "Pick up where you left off",
    headingWithStreak: (n) => `You built a ${n}-day streak`,
    headingNoStreak: "Your progress is saved",
    body: "It's been a little while, and that's completely fine — everything you earned is still here. One lesson, about fifteen minutes, and you're moving again.",
    cta: "Continue learning",
  },
  "pt-BR": {
    subjectWithStreak: (n) =>
      `Sua sequência de ${n} dias está esperando por você`,
    subjectNoStreak: "Sua próxima lição está exatamente onde você parou",
    eyebrow: "Continue de onde parou",
    headingWithStreak: (n) => `Você construiu uma sequência de ${n} dias`,
    headingNoStreak: "Seu progresso está salvo",
    body: "Faz um tempinho, e tudo bem — tudo o que você conquistou continua aí. Uma lição, uns quinze minutos, e você já volta a avançar.",
    cta: "Continuar estudando",
  },
  es: {
    subjectWithStreak: (n) => `Tu racha de ${n} días te está esperando`,
    subjectNoStreak: "Tu próxima lección está justo donde la dejaste",
    eyebrow: "Continúa donde lo dejaste",
    headingWithStreak: (n) => `Construiste una racha de ${n} días`,
    headingNoStreak: "Tu progreso está guardado",
    body: "Pasó un tiempo, y no pasa nada — todo lo que lograste sigue ahí. Una lección, unos quince minutos, y vuelves a avanzar.",
    cta: "Seguir aprendiendo",
  },
};

function pickCopy<T>(table: Record<EmailLocale, T>, locale: string | null): T {
  return table[(locale ?? "") as EmailLocale] ?? table.en;
}

/**
 * "Come back — your progress is waiting" (#870). Sent after
 * `INACTIVITY_THRESHOLD_DAYS` (see `lib/email/reengagement.ts`) days without
 * activity, on REMINDER consent.
 *
 * Nothing user-authored reaches this template: the only variable is a streak
 * count, which is shape-checked by {@link safeCount} and, like every subject in
 * this file, still passed through {@link scrubHeaderValue} (#812).
 */
export function reengagementNudgeEmail(
  params: ReengagementNudgeParams
): RenderedEmail {
  const copy = pickCopy(REENGAGEMENT_COPY, params.locale);
  const footer = pickCopy(REENGAGEMENT_FOOTER, params.locale);
  const streak = safeCount(params.streakDays);
  const subject = scrubHeaderValue(
    streak === null ? copy.subjectNoStreak : copy.subjectWithStreak(streak)
  );
  const heading =
    streak === null ? copy.headingNoStreak : copy.headingWithStreak(streak);

  const html = renderCard({
    eyebrow: copy.eyebrow,
    heading,
    body: copy.body,
    ctaLabel: copy.cta,
    ctaUrl: params.dashboardUrl,
    footer: footer.footer,
    unsubscribeLabel: footer.unsubscribe,
    unsubscribeUrl: params.unsubscribeUrl,
  });

  const text = [
    subject,
    "",
    copy.body,
    params.dashboardUrl,
    "",
    "—",
    footer.footer,
    `${footer.unsubscribe}: ${params.unsubscribeUrl}`,
  ].join("\n");

  return { subject, html, text };
}

// ── (b) "You were close — one lesson left in <course>" ───────────────────────

export interface CourseNudgeParams {
  /** Unknown/absent locale falls back to `en`. */
  locale: string | null;
  /** Course title — content-authored, but still escaped and scrubbed. */
  courseTitle: string;
  /** Title of the next incomplete lesson. Empty string omits the note line. */
  lessonTitle: string;
  /** Lessons still incomplete in that course. Non-counts render as 1. */
  lessonsRemaining: number;
  /** Absolute deep link at the learner's next incomplete lesson. */
  lessonUrl: string;
  /** REQUIRED — per-recipient one-click link that clears REMINDER consent only. */
  unsubscribeUrl: string;
}

interface CourseNudgeCopy {
  subjectOne: (course: string) => string;
  subjectMany: (n: number, course: string) => string;
  eyebrow: string;
  headingOne: (course: string) => string;
  headingMany: (n: number, course: string) => string;
  bodyOne: string;
  bodyMany: string;
  nextUp: (lesson: string) => string;
  cta: string;
}

const COURSE_NUDGE_COPY: Record<EmailLocale, CourseNudgeCopy> = {
  en: {
    subjectOne: (c) => `One lesson left in ${c}`,
    subjectMany: (n, c) => `${n} lessons left in ${c}`,
    eyebrow: "Almost there",
    headingOne: (c) => `One lesson left in ${c}`,
    headingMany: (n, c) => `${n} lessons left in ${c}`,
    bodyOne:
      "You're one lesson from the end of this course. It'll still be there whenever you have the time — no rush.",
    bodyMany:
      "You're close to the end of this course. Pick it back up whenever it suits you; your progress is exactly where you left it.",
    nextUp: (l) => `Next up: ${l}`,
    cta: "Finish the course",
  },
  "pt-BR": {
    subjectOne: (c) => `Falta uma lição em ${c}`,
    subjectMany: (n, c) => `Faltam ${n} lições em ${c}`,
    eyebrow: "Quase lá",
    headingOne: (c) => `Falta uma lição em ${c}`,
    headingMany: (n, c) => `Faltam ${n} lições em ${c}`,
    bodyOne:
      "Falta uma lição para você terminar este curso. Ela vai estar lá quando você tiver tempo — sem pressa.",
    bodyMany:
      "Você está perto do fim deste curso. Retome quando for melhor para você; seu progresso está exatamente onde você parou.",
    nextUp: (l) => `A seguir: ${l}`,
    cta: "Concluir o curso",
  },
  es: {
    subjectOne: (c) => `Te queda una lección en ${c}`,
    subjectMany: (n, c) => `Te quedan ${n} lecciones en ${c}`,
    eyebrow: "Ya casi",
    headingOne: (c) => `Te queda una lección en ${c}`,
    headingMany: (n, c) => `Te quedan ${n} lecciones en ${c}`,
    bodyOne:
      "Te falta una lección para terminar este curso. Estará ahí cuando tengas tiempo — sin apuro.",
    bodyMany:
      "Estás cerca del final de este curso. Retómalo cuando quieras; tu progreso está justo donde lo dejaste.",
    nextUp: (l) => `A continuación: ${l}`,
    cta: "Terminar el curso",
  },
};

/**
 * "You were close — one lesson left in <course>" (#870), on REMINDER consent.
 *
 * SECURITY: `courseTitle` and `lessonTitle` are content-authored strings that
 * reach a mail header (the subject) and the HTML body. Both are escaped for the
 * body by {@link renderCard} and the subject goes through
 * {@link scrubHeaderValue}, so neither can split a header line (#812) nor inject
 * markup — the same treatment `newCourseAnnouncementEmail` gives a course title.
 */
export function courseNudgeEmail(params: CourseNudgeParams): RenderedEmail {
  const copy = pickCopy(COURSE_NUDGE_COPY, params.locale);
  const footer = pickCopy(REENGAGEMENT_FOOTER, params.locale);
  // A missing/broken remaining-count degrades to the singular variant: the
  // course nudge only ever fires near the end, so "one left" is the safe read.
  const remaining = safeCount(params.lessonsRemaining) ?? 1;
  const one = remaining === 1;

  const subject = scrubHeaderValue(
    one
      ? copy.subjectOne(params.courseTitle)
      : copy.subjectMany(remaining, params.courseTitle)
  );
  const heading = one
    ? copy.headingOne(params.courseTitle)
    : copy.headingMany(remaining, params.courseTitle);
  const body = one ? copy.bodyOne : copy.bodyMany;
  const note = params.lessonTitle
    ? copy.nextUp(scrubHeaderValue(params.lessonTitle))
    : undefined;

  const html = renderCard({
    eyebrow: copy.eyebrow,
    heading,
    body,
    note,
    ctaLabel: copy.cta,
    ctaUrl: params.lessonUrl,
    footer: footer.footer,
    unsubscribeLabel: footer.unsubscribe,
    unsubscribeUrl: params.unsubscribeUrl,
  });

  const text = [
    subject,
    "",
    body,
    ...(note ? [note] : []),
    params.lessonUrl,
    "",
    "—",
    footer.footer,
    `${footer.unsubscribe}: ${params.unsubscribeUrl}`,
  ].join("\n");

  return { subject, html, text };
}
