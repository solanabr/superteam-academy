import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "./admin-login-form";
import { isValidAdminSession } from "@/lib/admin/auth";

/**
 * `/admin` root. Unauthenticated → render `<AdminLoginForm/>` (the layout
 * leaves it unwrapped). Authenticated → redirect to the default console
 * screen. The session is checked here rather than redirecting
 * unconditionally: the middleware bounces unauthenticated `/admin/*`
 * sub-routes back to `/admin`, so an unconditional redirect would loop
 * (`/admin` → `/admin/status` → middleware → `/admin` → …).
 */
export default async function AdminPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  // Gate on the signed admin_session cookie only. The secret is never read
  // here, so it cannot be serialized into the client payload (P0-B6).
  // isValidAdminSession returns false when ADMIN_SECRET is unset.
  if (!isValidAdminSession(session?.value)) {
    return <AdminLoginForm />;
  }

  redirect(`/${locale}/admin/status`);
}
