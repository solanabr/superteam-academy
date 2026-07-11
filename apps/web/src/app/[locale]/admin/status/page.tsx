import { getTranslations } from "next-intl/server";

/**
 * Placeholder for the console's default screen. `/admin` redirects here on a
 * valid session, so it exists to avoid landing authenticated admins on a 404
 * before Task 3 wires the real program-status bar, `<DataResyncPanel/>`, and
 * deploy counts. Task 3 replaces this file.
 */
export default async function AdminStatusPage() {
  const t = await getTranslations("admin");

  return (
    <h2 className="font-display text-xl font-bold text-text">
      {t("screens.status")}
    </h2>
  );
}
