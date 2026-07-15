"use client";

import { useTranslations } from "next-intl";
import {
  StatusBadge,
  ContentDriftBadge,
} from "@/components/admin/status-badge";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminDisclosure } from "@/components/admin/admin-disclosure";
import type { CourseContentDrift } from "@/lib/github/drift";

/**
 * Legend for the deploy table's badges. It renders the *real* badge components
 * so what you read here is pixel-for-pixel what a row shows — the on-chain
 * `StatusBadge` set, the orthogonal `ContentDriftBadge` set, and the immutable
 * mismatch, which shows no badge at all (the row swaps the Deploy button for a
 * warning) and so would otherwise never be explained anywhere.
 */

const ON_CHAIN_STATES = [
  "not_deployed",
  "synced",
  "out_of_sync",
  "draft",
  "missing_fields",
] as const;

// ContentDriftBadge derives its state from (onChainStatus, contentDrift); these
// are the pairs that produce each drift badge on a deployed row.
const DRIFT_STATES: ReadonlyArray<{
  key: "drifted" | "blocked" | "unknown";
  contentDrift: CourseContentDrift;
}> = [
  { key: "drifted", contentDrift: "behind" },
  { key: "blocked", contentDrift: "blocked" },
  { key: "unknown", contentDrift: "unknown" },
];

export function DeployLegend() {
  const t = useTranslations("admin.coursesScreen.legend");

  return (
    <AdminCard as="section">
      <AdminDisclosure
        headingLevel={3}
        summary={
          <span className="font-display text-base font-bold text-text">
            {t("title")}
          </span>
        }
      >
        <p className="mt-1 text-sm text-text-3">{t("description")}</p>

        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-3">
              {t("onChainHeading")}
            </p>
            <dl className="space-y-2">
              {ON_CHAIN_STATES.map((status) => (
                <div
                  key={status}
                  className="flex flex-wrap items-baseline gap-2"
                >
                  <dt className="shrink-0">
                    <StatusBadge status={status} />
                  </dt>
                  <dd className="min-w-0 flex-1 text-sm text-text-3">
                    {t(status)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-3">
              {t("driftHeading")}
            </p>
            <dl className="space-y-2">
              {DRIFT_STATES.map(({ key, contentDrift }) => (
                <div key={key} className="flex flex-wrap items-baseline gap-2">
                  <dt className="shrink-0">
                    <ContentDriftBadge
                      onChainStatus="synced"
                      contentDrift={contentDrift}
                    />
                  </dt>
                  <dd className="min-w-0 flex-1 text-sm text-text-3">
                    {t(key)}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 rounded-md border border-danger bg-danger-light p-3">
              <p className="text-sm font-semibold text-danger">
                {t("immutableTitle")}
              </p>
              <p className="mt-1 text-sm text-text-2">{t("immutableBody")}</p>
            </div>
          </div>
        </div>
      </AdminDisclosure>
    </AdminCard>
  );
}
