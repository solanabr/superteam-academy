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

export function FlagsPanel({
  onCountChange,
}: {
  onCountChange?: (count: number) => void;
}) {
  const t = useTranslations("admin.flags");
  const [flags, setFlags] = useState<ModerationFlag[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<ActionError | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/flags");
      if (!res.ok) return;
      const body = (await res.json()) as { flags?: ModerationFlag[] };
      setFlags(body.flags ?? []);
    } catch {
      // Non-critical convenience view.
    }
  }, []);

  useEffect(() => {
    void load();
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

      {error && (
        <div className="rounded-md border border-danger bg-danger-light p-3 text-sm text-danger">
          {t(error === "network" ? "errorNetwork" : "errorFetch")}
        </div>
      )}

      {flags.length === 0 ? (
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
