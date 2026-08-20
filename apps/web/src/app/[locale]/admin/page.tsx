import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";

/**
 * `/admin` root. Admins land on the default console screen, which is Courses:
 * the console exists to get courses published and deployed, so that is what it
 * opens on. A signed-in non-admin gets a 404 (same contract as the layout);
 * an anonymous visitor is redirected to the landing by the middleware before
 * this page runs. There is no login form here anymore — admin access is the
 * learner's own Supabase session plus an `admin_users` row.
 */
export default async function AdminPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;

  const { locale } = params;

  const admin = await requireAdmin();
  if (!admin) notFound();

  redirect(`/${locale}/admin/courses`);
}
