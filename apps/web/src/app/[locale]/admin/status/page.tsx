import { getTranslations } from "next-intl/server";
import { StatusClient } from "./status-client";

/**
 * `/admin/status` — where the console stands: which chain it is pointed at,
 * whether the program is initialized there, how much content is deployed, and
 * the per-wallet data resync. The `/admin` root opens on Courses, not here.
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
