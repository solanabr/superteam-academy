import { getTranslations } from "next-intl/server";
import { PublishPinClient } from "./publish-pin-client";
import { DeployClient } from "./deploy-client";
import { DeployLegend } from "./deploy-legend";
import { AdminCard } from "@/components/admin/admin-card";

/**
 * `/admin/courses` — the merged content screen. It composes the two surfaces
 * that used to be separate (and unexplained) screens, in the order they
 * actually happen:
 *
 *   1. Publish (`PublishPinClient`, was `/admin/publish`) — is the content in
 *      the app? A human PR bumps `content.lock` and rebuilds the bundle.
 *   2. Deploy (`DeployClient`, was `/admin/deploy`) — is the course on chain
 *      and visible? Only on-chain fields (XP, rewards, lesson count, the
 *      immutable set) are involved.
 *
 * Neither component's behaviour changes here: this is composition plus the
 * teaching copy the old screens assumed you already knew. The step regions are
 * `aria-label`led rather than heading-wrapped so the moved cards keep their own
 * `h3`s at the right depth under this screen's `h2`.
 */
export default async function AdminCoursesPage() {
  const t = await getTranslations("admin");

  return (
    <div className="space-y-8">
      <section aria-labelledby="admin-courses-heading" className="space-y-4">
        <h2
          id="admin-courses-heading"
          className="font-display text-lg font-bold text-text"
        >
          {t("screens.courses")}
        </h2>

        <AdminCard className="space-y-4">
          <p className="text-sm text-text-2">{t("coursesScreen.intro.lede")}</p>
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
    </div>
  );
}
