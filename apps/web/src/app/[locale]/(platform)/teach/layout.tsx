import { redirect } from "next/navigation";
import { locales, defaultLocale, type Locale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";

interface TeachLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

/**
 * Server-side access gate for the teacher authoring area (`/teach/*`).
 *
 * This layout — NOT client-side hiding — is the security boundary:
 *   - Unauthenticated users are redirected to the landing page (the middleware
 *     also fail-closes `/teach`, but we re-check here as defense in depth).
 *   - Authenticated users whose `role` is not `teacher` or `admin` are
 *     redirected to their dashboard.
 * The role is read from the caller's OWN `profiles` row via the user-session
 * client, which RLS permits (own-row SELECT). No role write happens here.
 */
export default async function TeachLayout({
  children,
  params: { locale },
}: TeachLayoutProps) {
  const activeLocale: Locale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${activeLocale}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role;
  if (role !== "teacher" && role !== "admin") {
    redirect(`/${activeLocale}/dashboard`);
  }

  return <>{children}</>;
}
