import { getTranslations } from "next-intl/server";
import { ContentSyncPanel } from "@/components/admin/content-sync-panel";

/**
 * `/admin/publish` — the content-sync surface, moved as-is from the stacked
 * admin page (SP3-A Task 2). Intentionally zero new coupling: SP2-C/D retires
 * this screen by deleting this file plus its nav entry.
 */
export default async function AdminPublishPage() {
  const t = await getTranslations("admin");

  return (
    <section>
      <h2 className="mb-4 font-display text-lg font-bold text-text">
        {t("screens.publish")}
      </h2>
      <div className="rounded-lg border border-border bg-card p-4 shadow-card">
        <ContentSyncPanel />
      </div>
    </section>
  );
}
