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
  body: string;
  url: string | null;
}

/**
 * Which failure the last action hit — mapped to a translated string by the UI.
 * `conflict` is the 409 the route returns when the content is already gone, and
 * `rateLimited` its 429: both mean "don't just retry", unlike a plain 500.
 */
type ActionError = "fetch" | "network" | "conflict" | "rateLimited";

const ACTION_ERROR_KEY: Record<ActionError, string> = {
  fetch: "errorFetch",
  network: "errorNetwork",
  conflict: "errorConflict",
  rateLimited: "errorRateLimited",
};

/** What the moderator can do to a flag from the card. */
type FlagAction = "resolve" | "dismiss" | "remove" | "lock";

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
  const tCommunity = useTranslations("community");
  const [flags, setFlags] = useState<ModerationFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<ActionError | null>(null);
  // Removal is destructive and irreversible from this panel, so it takes a
  // second, deliberate click. Only one card can be armed at a time.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  // Threads locked in this session — `lock` leaves the flag pending, so the
  // card stays and its Lock button must stop offering a no-op.
  const [lockedIds, setLockedIds] = useState<string[]>([]);
  // Expanded "read the reported content here" blocks.
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  // The action landed but its audit row did not — reported, never swallowed.
  const [auditWarning, setAuditWarning] = useState(false);

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

  async function act(flagId: string, action: FlagAction) {
    setBusyId(flagId);
    setError(null);
    setAuditWarning(false);
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
        setError(
          res.status === 409
            ? "conflict"
            : res.status === 429
              ? "rateLimited"
              : "fetch"
        );
        return;
      }
      const body = (await res.json().catch(() => ({}))) as {
        audited?: boolean;
      };
      if (body.audited === false) setAuditWarning(true);

      if (action === "lock") {
        // A lock does not settle the report: the card stays, the button stops.
        setLockedIds((prev) => [...prev, flagId]);
        return;
      }
      // Optimistically drop the actioned flag.
      setFlags((prev) => prev.filter((f) => f.id !== flagId));
    } catch (e) {
      console.error("Admin flag action failed:", e);
      setError("network");
    } finally {
      setBusyId(null);
      setConfirmingId(null);
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
          {t(ACTION_ERROR_KEY[error])}
        </div>
      )}

      {auditWarning && (
        <div
          role="alert"
          className="rounded-md border border-streak bg-streak-light p-3 text-sm text-streak"
        >
          {t("auditWarning")}
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

              {/* No link means the thread or category lookup failed. The
                  moderator still has to decide, so the reported content itself
                  is offered here rather than a 200-char preview and nothing. */}
              {!flag.url && (
                <details
                  open={expandedIds.includes(flag.id)}
                  onToggle={(e) => {
                    const open = (e.currentTarget as HTMLDetailsElement).open;
                    setExpandedIds((prev) =>
                      open
                        ? [...new Set([...prev, flag.id])]
                        : prev.filter((id) => id !== flag.id)
                    );
                  }}
                  className="bg-bg-2 mt-2 rounded-md border border-border p-2"
                >
                  <summary className="cursor-pointer text-xs text-text-2">
                    {t("showContent")}
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap break-words text-xs text-text">
                    {flag.body || (
                      <span className="italic text-text-3">
                        {t("contentUnavailable")}
                      </span>
                    )}
                  </p>
                </details>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-3">
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

                {confirmingId === flag.id ? (
                  <>
                    <span className="text-xs text-danger">
                      {tCommunity("confirmDelete")}
                    </span>
                    <button
                      type="button"
                      onClick={() => void act(flag.id, "remove")}
                      disabled={busyId === flag.id}
                      className="rounded-md border border-danger bg-danger-light px-2.5 py-1 text-xs font-medium text-danger disabled:opacity-50"
                    >
                      {tCommunity("delete")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      disabled={busyId === flag.id}
                      className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-2 disabled:opacity-50"
                    >
                      {tCommunity("cancel")}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingId(flag.id)}
                    disabled={busyId === flag.id}
                    className="rounded-md border border-danger bg-danger-light px-2.5 py-1 text-xs font-medium text-danger disabled:opacity-50"
                  >
                    {t("remove")}
                  </button>
                )}

                {/* Locking is a thread-level control; an answer report has no
                    thread of its own to lock. */}
                {flag.targetType === "thread" && (
                  <button
                    type="button"
                    onClick={() => void act(flag.id, "lock")}
                    disabled={busyId === flag.id || lockedIds.includes(flag.id)}
                    className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-2 disabled:opacity-50"
                  >
                    {lockedIds.includes(flag.id) ? t("locked") : t("lock")}
                  </button>
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
