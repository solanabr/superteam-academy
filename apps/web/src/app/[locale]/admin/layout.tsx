import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { AdminNav } from "./admin-nav";
import { isValidAdminSession } from "@/lib/admin/auth";

/**
 * Admin console shell. When the `admin_session` cookie validates, it renders
 * the console chrome (header + persistent `<AdminNav/>`) around the active
 * screen. Otherwise it renders `{children}` unwrapped so the root page's
 * `<AdminLoginForm/>` shows without nav.
 *
 * The session gate is intentionally duplicated here and in `page.tsx`: the
 * layout decides whether to show chrome, the page decides login-vs-redirect.
 * Neither introduces new auth logic — both reuse `isValidAdminSession`, the
 * same primitive the middleware and API routes use.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  if (!isValidAdminSession(session?.value)) {
    return <>{children}</>;
  }

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
