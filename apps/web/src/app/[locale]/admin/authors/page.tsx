import { getTranslations } from "next-intl/server";
import { AdminCard } from "@/components/admin/admin-card";
import { AuthorsPanel } from "@/components/admin/authors-panel";

/**
 * `/admin/authors` — verified authors and the X handle shown next to their
 * badge. Data comes client-side from the requireAdmin-gated
 * `/api/admin/authors`, so this page does no server-side fetching of its own.
 */
export default async function AdminAuthorsPage() {
  const t = await getTranslations("admin");

  return (
    <section>
      <h2 className="mb-4 font-display text-lg font-bold text-text">
        {t("screens.authors")}
      </h2>
      <AdminCard>
        <AuthorsPanel />
      </AdminCard>
    </section>
  );
}
