export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

type CustomEventName =
  | "course_enrolled"
  | "lesson_completed"
  | "course_completed"
  | "challenge_passed"
  | "wallet_connected"
  | "xp_earned"
  | "streak_milestone"
  | "achievement_unlocked"
  | "language_changed";

declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "js",
      targetId: string | Date,
      params?: Record<string, string | number | boolean>,
    ) => void;
  }
}

function isConfigured(): boolean {
  return (
    GA_MEASUREMENT_ID !== "" &&
    typeof window !== "undefined" &&
    typeof window.gtag === "function"
  );
}

export function pageview(url: string): void {
  if (!isConfigured()) return;
  window.gtag!("config", GA_MEASUREMENT_ID, {
    page_path: url,
  });
}

export function event(
  action: CustomEventName | (string & {}),
  params: Record<string, string | number | boolean> = {},
): void {
  if (!isConfigured()) return;
  window.gtag!("event", action, params);
}

export function gtagScriptUrl(): string | null {
  if (!GA_MEASUREMENT_ID) return null;
  return `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
}

export function gtagInitScript(): string | null {
  if (!GA_MEASUREMENT_ID) return null;
  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}');
  `;
}
