import { getTranslations } from "next-intl/server";
import { StatusClient } from "./status-client";

/**
 * `/admin/status` — the console's default screen (the `/admin` root
 * redirects here on a valid session): program-status bar + deploy counts +
 * data resync, relocated from the stacked admin page (SP3-A Task 3).
 */
export default async function AdminStatusPage() {
  const t = await getTranslations("admin");

  return (
    <section>
      <h2 className="mb-4 font-display text-lg font-bold text-text">
        {t("screens.status")}
      </h2>
      <StatusClient />
    </section>
  );
}
