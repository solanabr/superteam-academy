"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

interface ModerationFlag {
  id: string;
  reason: string;
  details: string | null;
  createdAt: string;
  reporter: string | null;
  targetType: "thread" | "answer";
  preview: string;
  url: string | null;
}

/** Which failure the last action hit — mapped to a translated string by the UI. */
type ActionError = "fetch" | "network";

/**
 * Which failure the last queue load hit. `unauthorized` is split out from
 * `fetch` because the route 401s on an expired admin session, and that needs a
 * different instruction than a 500 — retrying a dead session just fails again.
 */
type LoadError = "fetch" | "network" | "unauthorized";

const LOAD_ERROR_KEY: Record<LoadError, string> = {
  fetch: "loadErrorFetch",
  network: "loadErrorNetwork",
  unauthorized: "loadErrorUnauthorized",
};

export function FlagsPanel({
  onCountChange,
}: {
  onCountChange?: (count: number) => void;
}) {
  const t = useTranslations("admin.flags");
  const tAdmin = useTranslations("admin");
  const [flags, setFlags] = useState<ModerationFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<ActionError | null>(null);

  // A failed load must never read as "queue is clear" (#1132), so it drops
  // whatever was on screen and renders the failed branch instead of the list.
  const load = useCallback((): void => {
    setLoading(true);
    setLoadError(null);
    void (async () => {
      try {
        const res = await fetch("/api/admin/flags");
        if (!res.ok) {
          setFlags([]);
          setLoadError(res.status === 401 ? "unauthorized" : "fetch");
          return;
        }
        const body = (await res.json()) as { flags?: ModerationFlag[] };
        setFlags(body.flags ?? []);
      } catch {
        setFlags([]);
        setLoadError("network");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the parent's badge count in sync with the list (incl. optimistic drops).
  useEffect(() => {
    onCountChange?.(flags.length);
  }, [flags, onCountChange]);

  async function act(flagId: string, action: "resolve" | "dismiss") {
    setBusyId(flagId);
    setError(null);
    try {
      const res = await fetch("/api/admin/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagId, action }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        console.error(
          "Admin flag action failed:",
          body.error ?? `Request failed (${res.status})`
        );
        setError("fetch");
        return;
      }
      // Optimistically drop the actioned flag.
      setFlags((prev) => prev.filter((f) => f.id !== flagId));
    } catch (e) {
      console.error("Admin flag action failed:", e);
      setError("network");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-3">{t("description")}</p>

      {/* Transient errors get the neutral `streak` treatment, not `danger` —
          the convention course-sync-table.tsx documents, where `danger` is
          reserved for blocking and destructive states. */}
      {error && (
        <div
          role="alert"
          className="rounded-md border border-streak bg-streak-light p-3 text-sm text-streak"
        >
          {t(error === "network" ? "errorNetwork" : "errorFetch")}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <p role="status" className="text-sm text-text-3">
            {t("loading")}
          </p>
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="rounded-md border border-streak bg-streak-light p-3 text-sm text-streak"
        >
          {t(LOAD_ERROR_KEY[loadError])}
          <button
            type="button"
            onClick={load}
            className="ml-3 underline hover:no-underline"
          >
            {tAdmin("states.retry")}
          </button>
        </div>
      ) : flags.length === 0 ? (
        <p className="text-sm text-text-3">{t("noPending")}</p>
      ) : (
        <ul className="space-y-2">
          {flags.map((flag) => (
            <li
              key={flag.id}
              className="rounded-md border border-border bg-card p-3 text-sm"
            >
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-danger bg-danger-light px-2 py-0.5 text-xs font-medium text-danger">
                  {flag.reason}
                </span>
                <span className="text-xs text-text-3">
                  {flag.targetType === "thread"
                    ? t("targetThread")
                    : t("targetAnswer")}{" "}
                  ·{" "}
                  {t("reportedBy", {
                    reporter: flag.reporter ?? t("unknownReporter"),
                  })}{" "}
                  · {new Date(flag.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-text">
                {flag.preview || <span className="italic text-text-3">—</span>}
              </p>
              {flag.details && (
                <p className="mt-1 text-xs text-text-2">“{flag.details}”</p>
              )}
              <div className="mt-2 flex items-center gap-3">
                {flag.url && (
                  <a
                    href={flag.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline hover:no-underline"
                  >
                    {t("view")}
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => void act(flag.id, "resolve")}
                  disabled={busyId === flag.id}
                  className="rounded-md border border-success bg-success-light px-2.5 py-1 text-xs font-medium text-success disabled:opacity-50"
                >
                  {t("resolve")}
                </button>
                <button
                  type="button"
                  onClick={() => void act(flag.id, "dismiss")}
                  disabled={busyId === flag.id}
                  className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-2 disabled:opacity-50"
                >
                  {t("dismiss")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
