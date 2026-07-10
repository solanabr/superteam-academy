"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type ContentDriftState = "up_to_date" | "behind" | "never_synced" | "blocked";

type ChainDriftState =
  | "content_current"
  | "content_stale"
  | "not_deployed"
  | "missing_fields"
  | "awaiting_content_sync";

interface CourseRow {
  id: string;
  title: string;
  chainDrift: ChainDriftState;
  activeLessons: string[] | null;
}

interface DriftResponse {
  content: {
    state: ContentDriftState;
    canSync: boolean;
    syncedSha: string | null;
    headSha: string;
    checks: string;
  };
  courses: CourseRow[];
}

const BUTTON_CLASSES =
  "rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-text shadow-push-sm transition-all hover:bg-subtle active:translate-y-[2px] active:shadow-push-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50";

const short = (sha: string | null): string => (sha ? sha.slice(0, 7) : "—");

export function ContentSyncPanel() {
  const t = useTranslations("adminContentSync");
  const [drift, setDrift] = useState<DriftResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [chainBusy, setChainBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setUnavailable(false);
    try {
      const res = await fetch("/api/admin/content/drift");
      if (!res.ok) {
        setUnavailable(true);
        setDrift(null);
        return;
      }
      setDrift((await res.json()) as DriftResponse);
    } catch {
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runContentSync = useCallback(async () => {
    if (!drift) return;
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/content/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sha: drift.content.headSha }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        written?: number;
        pruned?: number;
      };
      if (!res.ok) {
        setMessage(body.error ?? t("syncFailed"));
      } else {
        setMessage(
          t("syncSucceeded", {
            written: body.written ?? 0,
            pruned: body.pruned ?? 0,
          })
        );
        await load();
      }
    } catch {
      setMessage(t("syncFailed"));
    } finally {
      setSyncing(false);
    }
  }, [drift, t, load]);

  const runChainSync = useCallback(
    async (row: CourseRow) => {
      if (!row.activeLessons) return;
      setChainBusy(row.id);
      setMessage(null);
      try {
        const res = await fetch("/api/admin/courses/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: row.id,
            activeLessons: row.activeLessons,
          }),
        });
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage(
          res.ok
            ? t("chainSyncSucceeded", { id: row.id })
            : (body.error ?? t("chainSyncFailed"))
        );
        if (res.ok) await load();
      } catch {
        setMessage(t("chainSyncFailed"));
      } finally {
        setChainBusy(null);
      }
    },
    [t, load]
  );

  if (loading) {
    return <p className="text-sm text-text-3">{t("loading")}</p>;
  }

  if (unavailable || !drift) {
    return (
      <div className="space-y-3">
        <div
          role="alert"
          className="rounded-md border border-danger bg-danger-light p-3 text-sm text-danger"
        >
          {t("driftUnavailable")}
        </div>
        <button className={BUTTON_CLASSES} onClick={() => void load()}>
          {t("retry")}
        </button>
      </div>
    );
  }

  const { content, courses } = drift;
  const contentUpToDate = content.state === "up_to_date";
  const bannerTone =
    content.state === "up_to_date"
      ? "border-success bg-success-light text-success"
      : content.state === "blocked"
        ? "border-danger bg-danger-light text-danger"
        : "border-border bg-subtle text-text-2";

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-3">{t("description")}</p>

      <div className={`rounded-md border p-3 text-sm ${bannerTone}`}>
        <div className="mb-2 font-medium">{t(`state.${content.state}`)}</div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-text-2">
          <span>{t("head", { sha: short(content.headSha) })}</span>
          <span>{t("synced", { sha: short(content.syncedSha) })}</span>
          <span>{t("ci", { state: content.checks })}</span>
        </div>
      </div>

      <button
        className={BUTTON_CLASSES}
        onClick={() => void runContentSync()}
        disabled={!content.canSync || syncing}
        aria-disabled={!content.canSync || syncing}
      >
        {syncing ? t("syncing") : t("syncButton")}
      </button>

      {message && (
        <div
          role="status"
          className="rounded-md border border-border bg-subtle p-3 text-sm text-text-2"
        >
          {message}
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-text">
          {t("coursesHeading")}
        </h3>
        {courses.length === 0 ? (
          <p className="text-sm text-text-3">{t("noCourses")}</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {courses.map((row) => {
              const canChainSync =
                contentUpToDate &&
                row.activeLessons !== null &&
                row.chainDrift !== "content_current";
              return (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-text">
                      {row.title}
                    </div>
                    <div className="text-xs text-text-3">
                      {t(`chain.${row.chainDrift}`)}
                    </div>
                  </div>
                  <button
                    className={`${BUTTON_CLASSES} shrink-0`}
                    onClick={() => void runChainSync(row)}
                    disabled={!canChainSync || chainBusy === row.id}
                    aria-disabled={!canChainSync || chainBusy === row.id}
                  >
                    {chainBusy === row.id
                      ? t("chainSyncing")
                      : t("chainSyncButton")}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
