import { getTranslations } from "next-intl/server";
import { InstructorCourses } from "./instructor-courses";
import { createClient } from "@/lib/supabase/server";
import { getInstructorCourses } from "@/lib/sanity/queries";

export const dynamic = "force-dynamic";

/**
 * `/teach` — read-only, wallet-keyed analytics viewer (PR-2 Task 6).
 *
 * Replaces the deleted CRUD authoring surface. Resolves the caller's
 * `wallet_address` the same way `authorizeTeacher()` does (own-row Supabase
 * SSR read via RLS) — but deliberately WITHOUT reading `role`: the
 * role-removal migration drops that column, so nothing under `/teach` may
 * depend on it anymore. Middleware already redirects unauthenticated
 * visitors to the landing page, so there is no separate signed-out state
 * here — only "has synced courses" and "does not" (the empty state).
 */
export default async function TeachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let wallet: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_address")
      .eq("id", user.id)
      .maybeSingle();
    wallet = profile?.wallet_address ?? null;
  }

  const courses = wallet ? await getInstructorCourses(wallet) : [];
  const t = await getTranslations("teach");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 font-display text-2xl font-bold text-text">
        {t("title")}
      </h1>
      <p className="mb-6 text-sm text-text-3">{t("subtitle")}</p>
      <InstructorCourses courses={courses} />
    </div>
  );
}
