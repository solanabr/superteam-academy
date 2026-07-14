"use client";

import { useTranslations } from "next-intl";
import type { CourseContentDrift } from "@/lib/github/drift";

type SyncStatus =
  | "synced"
  | "out_of_sync"
  | "not_deployed"
  | "draft"
  | "missing_fields"
  // #434: on-chain account exists but couldn't be decoded — must never
  // collapse into the green "synced" badge.
  | "undecodable"
  // #436: Supabase deployment-row read failed — distinct from "out_of_sync"
  // (which implies a real, confirmed content mismatch).
  | "db_unavailable";

interface StatusBadgeProps {
  status: SyncStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations("admin.statusBadge");
  const className: Record<SyncStatus, string> = {
    synced: "bg-success-bg border-success text-success",
    out_of_sync: "bg-accent-bg border-accent text-accent-dark dark:text-accent",
    not_deployed: "bg-danger-light border-danger text-danger",
    draft: "bg-subtle border-border text-text-3",
    missing_fields: "bg-streak-light border-streak text-streak",
    undecodable: "bg-primary-bg border-primary text-primary-dark",
    db_unavailable: "bg-subtle border-solana-purple text-solana-purple",
  };

  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${className[status]}`}
    >
      {t(status)}
    </span>
  );
}

/**
 * The content-drift badge state for a course row (SP3-C): the on-chain
 * `StatusBadge` says whether the deployed PDA matches its known address
 * (`out_of_sync` = on-chain drift); this says whether newer *content* is
 * published upstream that the deployed course predates (content drift). The two
 * are orthogonal — a course can be on-chain in-sync yet content-drifted.
 *
 * Content drift only matters once a course is on chain, so never-deployed /
 * draft / missing-fields rows return "none" (the on-chain badge already tells
 * the whole story). `up_to_date`/`never_synced` also render nothing.
 */
export function contentDriftBadgeState(
  onChainStatus: SyncStatus,
  contentDrift: CourseContentDrift
): "none" | "drifted" | "blocked" | "unknown" {
  const deployed =
    onChainStatus === "synced" || onChainStatus === "out_of_sync";
  if (!deployed) return "none";
  if (contentDrift === "behind") return "drifted";
  if (contentDrift === "blocked") return "blocked";
  if (contentDrift === "unknown") return "unknown";
  return "none";
}

interface ContentDriftBadgeProps {
  onChainStatus: SyncStatus;
  contentDrift: CourseContentDrift;
}

/**
 * Renders alongside `StatusBadge` when a deployed course has content drift.
 * Strings are localized under `admin.deployScreen.contentDrift.*`.
 */
export function ContentDriftBadge({
  onChainStatus,
  contentDrift,
}: ContentDriftBadgeProps) {
  const t = useTranslations("admin.deployScreen.contentDrift");
  const state = contentDriftBadgeState(onChainStatus, contentDrift);
  if (state === "none") return null;

  const className: Record<Exclude<typeof state, "none">, string> = {
    drifted: "bg-streak-light border-streak text-streak",
    blocked: "bg-danger-light border-danger text-danger",
    unknown: "bg-subtle border-border text-text-3",
  };

  return (
    <span
      title={t(`${state}Hint`)}
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${className[state]}`}
    >
      {t(state)}
    </span>
  );
}
