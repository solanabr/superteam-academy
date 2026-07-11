import { getTranslations } from "next-intl/server";
import { PublishPinClient } from "./publish-pin-client";
import { ContentSyncPanel } from "@/components/admin/content-sync-panel";

/**
 * `/admin/publish` — the content-publishing surface. SP3-B adds the "Content
 * pin" card (content.lock SHA vs courses-academy HEAD + a prefilled human PR
 * link) ABOVE the SP3-A content-sync panel. The panel is left untouched: SP2-C/D
 * retires it by deleting this file plus its nav entry, so no new coupling.
 */
export default async function AdminPublishPage() {
  const t = await getTranslations("admin");

  return (
    <section className="space-y-4">
      <h2 className="font-display text-lg font-bold text-text">
        {t("screens.publish")}
      </h2>
      <PublishPinClient />
      <div className="rounded-lg border border-border bg-card p-4 shadow-card">
        <ContentSyncPanel />
      </div>
    </section>
  );
}
