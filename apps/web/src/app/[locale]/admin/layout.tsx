import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin/auth";
import { AdminNav } from "./admin-nav";

/**
 * Admin console shell. The caller's Supabase session must belong to a user on
 * the `admin_users` allowlist (`requireAdmin`, service-role checked, fail
 * closed). A signed-in non-admin gets a 404 — the panel's existence is not
 * revealed. An anonymous visitor never reaches this layout: the middleware
 * redirects sessionless /admin requests to the localized landing.
 *
 * The gate is intentionally duplicated here and in `page.tsx` — both reuse
 * `requireAdmin`, the same primitive the API routes use, so neither introduces
 * new auth logic.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const t = await getTranslations("admin");

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-text">
            {t("console.title")}
          </h1>
          <p className="mt-1 text-sm text-text-3">{t("console.subtitle")}</p>
        </div>
        <div className="flex flex-col gap-6 md:flex-row">
          <AdminNav />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
