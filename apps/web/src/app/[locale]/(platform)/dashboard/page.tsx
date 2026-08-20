import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAuthClaims } from "@/lib/auth/dal";
import { Spinner } from "@/components/ui/spinner";
import { NextLessonPlan } from "@/components/dashboard/next-lesson-plan";
import {
  CohortStripSection,
  ContinueHeroSection,
  MainColumnSection,
  QuestsSection,
  ReviewStripSection,
} from "./sections";

// Auth cookie + per-user data on every render — never statically prerender.
export const dynamic = "force-dynamic";

function SectionFallback({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex items-center justify-center py-10"
    >
      <Spinner />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * Dashboard server shell (#1096). One server render replaces the old
 * client-side `useDashboardData` burst (~19 requests in 4 waves): the shared
 * claims read comes from the DAL, per-user Supabase reads run on the
 * cookie-bound server client, and content lookups are direct bundle imports.
 * Each independent section streams behind its own Suspense boundary; the
 * surfaces below stay independent slot components under
 * `components/dashboard/` so future surfaces land additively instead of
 * contending for this file.
 */
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [t, tCommon, claims] = await Promise.all([
    getTranslations("dashboard"),
    getTranslations("common"),
    getAuthClaims(),
  ]);

  // Middleware auth-gates /dashboard; this branch is defense-in-depth.
  if (!claims?.sub) redirect(`/${locale}`);
  const userId = claims.sub;
  const loading = tCommon("loading");

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-black tracking-[-0.5px] sm:text-3xl">
        {t("title")}
      </h1>

      {/* Hero Continue card — deep link to the next incomplete lesson (LX-B2).
          The ONE hero: everything below drops into the two-column working
          area so no other surface competes with it at full width. Shares the
          cache()d core loader with the main column — one data pass. */}
      <Suspense fallback={null}>
        <ContinueHeroSection userId={userId} />
      </Suspense>

      {/* Main column + right rail. The rail carries the day's actionable,
          glanceable surfaces (review queue, quests, league, session plan);
          the main column keeps the identity panel and the long sections.
          Single column below lg. The rail used to lead on mobile; the owner
          wants progress first (05-08) — level, achievements and courses —
          with the day's rail slots below them. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
        <aside className="order-2 space-y-6">
          {/* Due-review strip (LX-B6); renders nothing when the queue is empty. */}
          <Suspense fallback={<SectionFallback label={loading} />}>
            <ReviewStripSection userId={userId} />
          </Suspense>

          {/* Daily quests — extracted from the identity panel into its own
              rail card so the day's actions sit together. */}
          <Suspense fallback={<SectionFallback label={loading} />}>
            <QuestsSection userId={userId} />
          </Suspense>

          {/* Cohort league "you ±3" (LX-B9b) — shows a quiet solo state while
              this week's cohort is still filling. */}
          <Suspense fallback={<SectionFallback label={loading} />}>
            <CohortStripSection userId={userId} />
          </Suspense>

          {/* Session-end if-then plan — "when's your next lesson?" (LX-A6).
              Client island: reads and writes its own profiles.prefs slot. */}
          <NextLessonPlan userId={userId} />
        </aside>

        <div className="order-1 min-w-0 space-y-8">
          <Suspense fallback={<SectionFallback label={loading} />}>
            <MainColumnSection userId={userId} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
