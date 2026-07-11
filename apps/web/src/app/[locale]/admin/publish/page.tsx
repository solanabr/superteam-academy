import { getTranslations } from "next-intl/server";
import { PublishPinClient } from "./publish-pin-client";

/**
 * `/admin/publish` — the content-publishing surface. Publishing is a human PR
 * against `solanabr/courses-academy` (bump `content.lock` + recompile the
 * bundle); the SP3-B "Content pin" card shows the pinned SHA vs repo HEAD and
 * links a prefilled PR. The SP3-A Sanity content-sync panel was retired in
 * SP2-C along with its `/api/admin/content/sync` route.
 */
export default async function AdminPublishPage() {
  const t = await getTranslations("admin");

  return (
    <section className="space-y-4">
      <h2 className="font-display text-lg font-bold text-text">
        {t("screens.publish")}
      </h2>
      <PublishPinClient />
    </section>
  );
}
