"use client";

import { useTranslations } from "next-intl";
import { AdminBadge, type AdminBadgeTone } from "./admin-badge";
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
  // The on-chain badge carries a bespoke seven-state palette (two of them —
  // `synced`, `db_unavailable` — sit outside the shared semantic tones), so it
  // borrows only `AdminBadge`'s chrome and supplies its own colors.
  const className: Record<SyncStatus, string> = {
    synced: "bg-success-bg border-success text-success",
    out_of_sync: "bg-accent-bg border-accent text-accent-dark dark:text-accent",
    not_deployed: "bg-danger-light border-danger text-danger",
    draft: "bg-subtle border-border text-text-3",
    missing_fields: "bg-streak-light border-streak text-streak",
    undecodable: "bg-primary-bg border-primary text-primary-dark",
    db_unavailable: "bg-subtle border-solana-purple text-solana-purple",
  };

  return <AdminBadge className={className[status]}>{t(status)}</AdminBadge>;
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

  // Content drift maps cleanly onto the shared semantic tones: a red-CI upstream
  // commit is `danger` (blocking), a behind pin is `warning` (attention), an
  // unreachable GitHub is `neutral`.
  const tone: Record<Exclude<typeof state, "none">, AdminBadgeTone> = {
    drifted: "warning",
    blocked: "danger",
    unknown: "neutral",
  };

  return (
    <AdminBadge tone={tone[state]} title={t(`${state}Hint`)}>
      {t(state)}
    </AdminBadge>
  );
}
