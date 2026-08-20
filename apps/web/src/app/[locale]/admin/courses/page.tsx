import { getTranslations } from "next-intl/server";
import {
  getAllQuests,
  getLearningPathsForAdminWithRefs,
} from "@/lib/content/queries";
import { AdminCard } from "@/components/admin/admin-card";
import { PublishPinClient } from "./publish-pin-client";
import { DeployClient } from "./deploy-client";
import { DeployLegend } from "./deploy-legend";
import { ContentTabs } from "./content-tabs";
import { AchievementsSubview } from "./achievements-subview";
import { QuestsTable } from "./quests-table";
import { PathsTable } from "./paths-table";

/**
 * `/admin/courses` — the merged content screen. It composes the surfaces that
 * used to be separate (and unexplained) screens, in the order they actually
 * happen:
 *
 *   1. Publish (`PublishPinClient`, was `/admin/publish`) — is the content in
 *      the app? A human PR bumps `content.lock` and rebuilds the bundle.
 *   2. Deploy (`DeployClient`, was `/admin/deploy`) — is the course on chain
 *      and visible? Only on-chain fields (XP, rewards, lesson count, the
 *      immutable set) are involved.
 *   3. Supporting content (was `/admin/content`, #1136) — the Quests /
 *      Achievements / Paths tables. They ship in the same bundle and, for
 *      achievements, deploy through the same on-chain sync, so a separate nav
 *      entry only hid that they are the same flow.
 *
 * No component's behaviour changes here: this is composition plus the teaching
 * copy the old screens assumed you already knew. Quests/Paths are fetched here,
 * server-side, straight from the content bundle — they're static per-deploy
 * content, not on-chain state; Achievements stays a client sub-view because it
 * needs `useAdminStatus()` for sync status and the sync action. The step
 * regions are `aria-label`led rather than heading-wrapped so the moved cards
 * keep their own `h3`s at the right depth under this screen's `h2`.
 */
export default async function AdminCoursesPage() {
  const t = await getTranslations("admin");
  const [questData, paths] = await Promise.all([
    getAllQuests(),
    getLearningPathsForAdminWithRefs(),
  ]);
  const pathTitleById = Object.fromEntries(paths.map((p) => [p._id, p.title]));

  return (
    <div className="space-y-8">
      <section aria-labelledby="admin-courses-heading" className="space-y-4">
        <h2
          id="admin-courses-heading"
          className="font-display text-lg font-bold text-text"
        >
          {t("screens.courses")}
        </h2>

        {/* Collapsed by default. This explains the publish-then-deploy model,
            which is worth reading once and never again — as permanent chrome it
            just pushed the actual controls down the page. */}
        <AdminCard className="p-0">
          <details className="group">
            <summary className="cursor-pointer list-none rounded-md p-4 text-sm font-semibold text-text-2 outline-none transition-colors hover:text-text focus-visible:ring-2 focus-visible:ring-primary">
              {t("coursesScreen.intro.summary")}
            </summary>
            <div className="space-y-4 px-4 pb-4">
              <p className="text-sm text-text-2">
                {t("coursesScreen.intro.lede")}
              </p>
              <ol className="space-y-3">
                {(["step1", "step2"] as const).map((step) => (
                  <li key={step} className="space-y-1">
                    <p className="text-sm font-semibold text-text">
                      {t(`coursesScreen.intro.${step}Title`)}
                    </p>
                    <p className="text-sm text-text-3">
                      {t(`coursesScreen.intro.${step}Body`)}
                    </p>
                  </li>
                ))}
              </ol>
              <p className="rounded-md border border-primary bg-primary-bg p-3 text-sm text-text-2">
                {t("coursesScreen.intro.contentOnlyNote")}
              </p>
            </div>
          </details>
        </AdminCard>
      </section>

      <section
        aria-label={t("coursesScreen.step1Eyebrow")}
        className="space-y-2"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-text-3">
          {t("coursesScreen.step1Eyebrow")}
        </p>
        <PublishPinClient />
      </section>

      <section
        aria-label={t("coursesScreen.step2Eyebrow")}
        className="space-y-4"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-text-3">
          {t("coursesScreen.step2Eyebrow")}
        </p>
        <DeployLegend />
        <DeployClient />
      </section>

      <section
        aria-label={t("coursesScreen.step3Eyebrow")}
        className="space-y-4"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-text-3">
          {t("coursesScreen.step3Eyebrow")}
        </p>
        <ContentTabs
          questsSlot={<QuestsTable quests={questData.quests} />}
          achievementsSlot={
            <AchievementsSubview pathTitleById={pathTitleById} />
          }
          pathsSlot={<PathsTable paths={paths} />}
        />
      </section>
    </div>
  );
}
