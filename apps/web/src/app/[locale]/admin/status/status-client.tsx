"use client";

import { useTranslations } from "next-intl";
import { useAdminStatus } from "../use-admin-status";
import { DataResyncPanel } from "@/components/admin/data-resync-panel";

/**
 * `/admin/status` client (SP3-A Task 3): the inline program-status bar
 * relocated from the deleted stacked `admin-client.tsx`, plus the deploy
 * counts and `<DataResyncPanel/>`. The `/api/admin/status` fetch +
 * loading/error/refetch now live in the shared `useAdminStatus` hook (SP3-D);
 * the manual Refresh button restores the affordance the bar lost in the
 * route split, wired to the hook's `refetch`.
 */
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

  if (error) {
    return (
      <div className="rounded-md border border-danger bg-danger-light p-4 text-sm text-danger">
        {t(error === "network" ? "states.networkError" : "states.fetchError")}
        <button onClick={refetch} className="ml-3 underline hover:no-underline">
          {t("states.retry")}
        </button>
      </div>
    );
  }

  if (!status) return null;

  const { program, courses, achievements } = status;

  return (
    <div className="space-y-8">
      {/* Program status bar */}
      <div className="rounded-lg border border-border bg-card p-4 text-sm shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-text-3">{t("programBar.network")}:</span>
          <span className="text-text">devnet</span>
          <span className="text-border">|</span>
          <span className="text-text-3">{t("programBar.program")}:</span>
          <span className="font-mono text-xs text-text">
            {program.programId.slice(0, 8)}...{program.programId.slice(-4)}
          </span>
          <span className="text-border">|</span>
          <span className="text-text-3">{t("programBar.config")}:</span>
          {program.deployed ? (
            <span className="text-success">{t("programBar.found")}</span>
          ) : (
            <span className="text-danger">
              {t("programBar.notInitialized")}
            </span>
          )}
          {!program.authorityMatch.matches && (
            <span className="ml-2 text-xs text-accent">
              {t("programBar.authorityMismatch")}
            </span>
          )}
          <button
            onClick={refetch}
            className="ml-auto rounded-md border border-border bg-card px-3 py-1 text-xs text-text-2 shadow-push-sm transition-all hover:bg-subtle active:translate-y-[2px] active:shadow-push-active"
          >
            {t("states.refresh")}
          </button>
        </div>
      </div>

      {/* Deploy counts */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4 text-sm shadow-card">
        <span className="text-text-3">{t("counts.courses")}:</span>
        <span className="text-text">{courses.length}</span>
        <span className="text-border">|</span>
        <span className="text-text-3">{t("counts.achievements")}:</span>
        <span className="text-text">{achievements.length}</span>
      </div>

      {/* Data Resync */}
      <section>
        <h3 className="mb-4 font-display text-lg font-bold text-text">
          {t("resync.heading")}
        </h3>
        <div className="rounded-lg border border-border bg-card p-4 shadow-card">
          <DataResyncPanel />
        </div>
      </section>
    </div>
  );
}
