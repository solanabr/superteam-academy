"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { RpcNetwork } from "@/lib/solana/network";
import {
  AdminBadge,
  type AdminBadgeTone,
} from "@/components/admin/admin-badge";
import { AdminButton } from "@/components/admin/admin-button";
import { AdminCard } from "@/components/admin/admin-card";
import { DataResyncPanel } from "@/components/admin/data-resync-panel";
import { useAdminStatus } from "../use-admin-status";

/**
 * `/admin/status` client: which chain the console is pointed at, whether the
 * program is initialized there, how much content is deployed, and the resync
 * tool. Data comes from the shared `useAdminStatus` hook (`GET
 * /api/admin/status`), same as `/admin/courses`.
 *
 * The network is a server-derived field, not a literal (#1140) — the screen
 * whose job is telling an operator which chain they are on cannot be the one
 * screen that guesses.
 */

/**
 * `mainnet` reads as attention rather than "fine": it is the chain where a
 * mistaken deploy is permanent. `unknown` is the same tone because the RPC
 * host named no cluster, so mainnet has not been ruled out.
 */
const NETWORK_TONE: Record<RpcNetwork, AdminBadgeTone> = {
  devnet: "neutral",
  mainnet: "warning",
  unknown: "warning",
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-semibold uppercase tracking-wide text-text-3">
        {label}
      </dt>
      <dd className="text-sm text-text">{children}</dd>
    </div>
  );
}

export function StatusClient() {
  const t = useTranslations("admin");
  const { status, loading, error, refetch } = useAdminStatus();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-text-3">{t("states.loading")}</div>
      </div>
    );
  }

  // A failed status fetch is transient/recoverable — neutral `streak`, not the
  // blocking `danger` red. Same tone as the sibling deploy screen.
  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center gap-3 rounded-md border border-streak bg-streak-light p-4 text-sm text-streak"
      >
        {t(error === "network" ? "states.networkError" : "states.fetchError")}
        <AdminButton onClick={refetch}>{t("states.retry")}</AdminButton>
      </div>
    );
  }

  // Not loading, no error, no payload: rare, but a blank screen used to be the
  // whole answer here. Say so and offer the same retry.
  if (!status) {
    return (
      <AdminCard className="flex flex-wrap items-center gap-3 text-sm text-text-2">
        {t("states.unavailable")}
        <AdminButton onClick={refetch}>{t("states.retry")}</AdminButton>
      </AdminCard>
    );
  }

  const { program, courses, achievements } = status;

  return (
    <div className="space-y-8">
      <AdminCard
        as="section"
        aria-labelledby="admin-status-program"
        className="space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3
            id="admin-status-program"
            className="font-display text-base font-bold text-text"
          >
            {t("statusScreen.programHeading")}
          </h3>
          <AdminButton onClick={refetch}>{t("states.refresh")}</AdminButton>
        </div>

        <dl className="grid gap-4 sm:grid-cols-3">
          <Field label={t("programBar.network")}>
            <AdminBadge tone={NETWORK_TONE[program.network]}>
              {program.network === "unknown"
                ? t("programBar.networkUnknown")
                : program.network}
            </AdminBadge>
          </Field>
          <Field label={t("programBar.program")}>
            <span className="font-mono text-xs text-text">
              {program.programId.slice(0, 8)}...{program.programId.slice(-4)}
            </span>
          </Field>
          <Field label={t("programBar.config")}>
            <AdminBadge tone={program.deployed ? "success" : "danger"}>
              {program.deployed
                ? t("programBar.found")
                : t("programBar.notInitialized")}
            </AdminBadge>
          </Field>
        </dl>

        {!program.authorityMatch.matches && (
          <p
            role="alert"
            className="rounded-md border border-danger bg-danger-light p-3 text-xs text-danger"
          >
            {t("programBar.authorityMismatch")}
          </p>
        )}
      </AdminCard>

      <AdminCard
        as="section"
        aria-labelledby="admin-status-counts"
        className="space-y-4"
      >
        <h3
          id="admin-status-counts"
          className="font-display text-base font-bold text-text"
        >
          {t("statusScreen.countsHeading")}
        </h3>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label={t("counts.courses")}>
            <span className="font-display text-2xl font-bold text-text">
              {courses.length}
            </span>
          </Field>
          <Field label={t("counts.achievements")}>
            <span className="font-display text-2xl font-bold text-text">
              {achievements.length}
            </span>
          </Field>
        </dl>
      </AdminCard>

      <AdminCard
        as="section"
        aria-labelledby="admin-status-resync"
        className="space-y-4"
      >
        <h3
          id="admin-status-resync"
          className="font-display text-base font-bold text-text"
        >
          {t("resync.heading")}
        </h3>
        <DataResyncPanel />
      </AdminCard>
    </div>
  );
}
