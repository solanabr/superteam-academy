"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { DiffEntry } from "@/lib/admin/sync-diff";
import type {
  RecreatePreflightData,
  RecreatePreflightRefusal,
} from "@/lib/admin/recreate-preflight";
import type { RecreateCourseResult } from "@/lib/admin/recreate-course";
import { sanitizeReason } from "@/lib/admin/sanitize-reason";

interface RecreateCourseFlowProps {
  courseId: string;
  courseTitle: string;
  /** Row-level immutable diffs (from the status payload) for the at-a-glance card. */
  immutableDiffs: DiffEntry[];
  /** Called after a successful recreate so the parent can refetch the status. */
  onRecreated: () => void;
}

type Phase = "idle" | "loading" | "confirm" | "executing" | "done" | "error";

/** Shape of the execute route's failure body (405/400/500). */
interface ExecuteError {
  error: string;
  phase?: string;
  courseIntact?: boolean;
}

/**
 * WS-2 — the actionable replacement for the immutable-mismatch dead-end. Shows
 * the immutable diffs, then drives the platform's single most destructive
 * on-chain operation (`close_course` → `create_course`) behind a read-only
 * preflight and a non-dismissible, type-to-confirm modal.
 */
export function RecreateCourseFlow({
  courseId,
  courseTitle,
  immutableDiffs,
  onRecreated,
}: RecreateCourseFlowProps) {
  const t = useTranslations("admin.deployScreen.recreate");
  const [phase, setPhase] = useState<Phase>("idle");
  const [preflight, setPreflight] = useState<RecreatePreflightData | null>(
    null
  );
  const [refusal, setRefusal] = useState<RecreatePreflightRefusal | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [result, setResult] = useState<RecreateCourseResult | null>(null);
  const [execError, setExecError] = useState<ExecuteError | null>(null);

  const hasCreatorMismatch = immutableDiffs.some((d) => d.field === "creator");

  async function openPreflight(): Promise<void> {
    setPhase("loading");
    setRefusal(null);
    setLoadError(null);
    try {
      const res = await fetch(
        `/api/admin/courses/recreate/preflight?courseId=${encodeURIComponent(courseId)}`
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setLoadError(data.error ?? t("loadErrorHeading"));
        setPhase("error");
        return;
      }
      const data = (await res.json()) as
        | RecreatePreflightData
        | RecreatePreflightRefusal;
      if (!data.canRecreate) {
        setRefusal(data);
        setPhase("idle");
        return;
      }
      setPreflight(data);
      setPhase("confirm");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : t("loadErrorHeading"));
      setPhase("error");
    }
  }

  async function execute(allowUnusual: boolean): Promise<void> {
    setPhase("executing");
    setExecError(null);
    const body: Record<string, unknown> = { courseId, confirm: courseId };
    if (allowUnusual) {
      body.allowUnusualCreator = true;
      body.acknowledgeUnusualCreator = courseId;
    }
    try {
      const res = await fetch("/api/admin/courses/recreate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as RecreateCourseResult | ExecuteError;
      if (!res.ok) {
        setExecError(data as ExecuteError);
        setPhase("error");
        return;
      }
      setResult(data as RecreateCourseResult);
      setPhase("done");
    } catch (e) {
      setExecError({ error: e instanceof Error ? e.message : String(e) });
      setPhase("error");
    }
  }

  // ----- Success summary -----
  if (phase === "done" && result) {
    return (
      <div className="mt-3 rounded-md border border-success bg-success-light p-3 text-sm">
        <p className="mb-2 font-semibold text-success">{t("result.heading")}</p>
        <dl className="space-y-1 font-mono text-xs text-text-2">
          <SummaryRow label={t("result.coursePda")} value={result.coursePda} />
          <SummaryRow
            label={t("result.closeSignature")}
            value={result.closeSignature}
          />
          <SummaryRow
            label={t("result.createSignature")}
            value={result.createSignature}
          />
          <SummaryRow
            label={t("result.attempts")}
            value={String(result.createAttempts)}
          />
        </dl>
        <p className="mt-2 text-xs text-text-3">
          {t("result.lostCounters", {
            completions: result.lostCounters.totalCompletions,
            enrollments: result.lostCounters.totalEnrollments,
          })}
        </p>
        {result.warnings.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-semibold text-streak">
              {t("result.warningsHeading")}
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-streak">
              {result.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        )}
        <button
          onClick={onRecreated}
          className="mt-3 rounded-md bg-primary px-3 py-1 font-display text-xs font-bold text-white shadow-push transition-all duration-100 hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-[3px] active:shadow-push-active"
        >
          {t("result.refresh")}
        </button>
      </div>
    );
  }

  // ----- Execute failure (course may be DOWN) -----
  if (phase === "error" && execError) {
    return (
      <div className="mt-3 rounded-md border border-danger bg-danger-light p-3 text-sm">
        <p className="mb-2 font-semibold text-danger">
          {t("execError.heading")}
        </p>
        <p className="text-xs text-danger">{sanitizeReason(execError.error)}</p>
        {execError.courseIntact === false && (
          <p className="mt-2 rounded border border-danger bg-card p-2 text-xs font-medium text-danger">
            {t("execError.downRecovery")}
          </p>
        )}
        {execError.courseIntact === undefined && (
          <p className="mt-2 rounded border border-danger bg-card p-2 text-xs font-medium text-danger">
            {t("execError.indeterminateRecovery")}
          </p>
        )}
        <button
          onClick={() => {
            setExecError(null);
            setPhase("idle");
          }}
          className="mt-3 rounded-md border border-border bg-card px-3 py-1 text-xs font-medium text-text shadow-push-sm transition-all hover:bg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-[2px] active:shadow-push-active"
        >
          {t("execError.close")}
        </button>
      </div>
    );
  }

  // ----- The at-a-glance card + confirm modal -----
  return (
    <div className="mt-3 rounded-md border border-danger bg-danger-light p-3 text-sm">
      <p className="mb-2 font-semibold text-danger">{t("cardHeading")}</p>
      {hasCreatorMismatch && (
        <p className="mb-2 rounded border border-danger bg-card p-2 text-xs font-semibold text-danger">
          {t("creatorEmphasis")}
        </p>
      )}
      <ul className="space-y-1 font-mono text-xs text-danger">
        {immutableDiffs.map((d) => (
          <li key={d.field}>
            <span className="text-text-3">{d.field}:</span> {t("onChainLabel")}{" "}
            <span className="text-danger">{String(d.onChainValue)}</span> →{" "}
            {t("bundleLabel")}{" "}
            <span className="text-accent">{String(d.contentValue)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-text-3">{t("cardIntro")}</p>

      {loadError && phase === "error" && (
        <p className="mt-2 text-xs text-danger">{loadError}</p>
      )}

      {refusal && (
        <div className="mt-2 rounded border border-streak bg-streak-light p-2 text-xs text-streak">
          <p className="font-semibold">{t("refusedHeading")}</p>
          <p className="mt-1">
            {refusal.reasonCode === "noImmutableDiff"
              ? t("refusalReason.noImmutableDiff")
              : refusal.reasonCode === "unconfirmed"
                ? t("refusalReason.unconfirmed")
                : refusal.reason}
          </p>
        </div>
      )}

      <button
        onClick={() => void openPreflight()}
        disabled={phase === "loading"}
        className="mt-3 rounded-md border border-danger bg-card px-3 py-1 font-display text-xs font-bold text-danger shadow-push-sm transition-all hover:bg-danger hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger active:translate-y-[2px] active:shadow-push-active disabled:pointer-events-none disabled:opacity-50"
      >
        {phase === "loading" ? t("loading") : t("reviewButton")}
      </button>

      {phase === "confirm" && preflight && (
        <RecreateConfirmModal
          preflight={preflight}
          courseTitle={courseTitle}
          busy={false}
          onCancel={() => {
            setPreflight(null);
            setPhase("idle");
          }}
          onConfirm={(allowUnusual) => void execute(allowUnusual)}
        />
      )}
      {phase === "executing" && preflight && (
        <RecreateConfirmModal
          preflight={preflight}
          courseTitle={courseTitle}
          busy
          onCancel={() => undefined}
          onConfirm={() => undefined}
        />
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-text-3">{label}:</dt>
      <dd className="break-all text-text-2">{value}</dd>
    </div>
  );
}

interface RecreateConfirmModalProps {
  preflight: RecreatePreflightData;
  courseTitle: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (allowUnusual: boolean) => void;
}

/**
 * Non-dismissible confirm modal. Deliberately NOT dismiss-by-habit: the
 * backdrop does not close it (no click-outside), only an explicit Cancel/Esc or
 * Confirm resolves it. Confirm is gated on typing the exact courseId, and — for
 * an F4 unusual creator — a SECOND explicit acknowledgement checkbox. Only when
 * that ack is checked does the execute POST carry `allowUnusualCreator` +
 * `acknowledgeUnusualCreator`.
 */
function RecreateConfirmModal({
  preflight,
  courseTitle,
  busy,
  onCancel,
  onConfirm,
}: RecreateConfirmModalProps) {
  const t = useTranslations("admin.deployScreen.recreate.modal");
  const [typed, setTyped] = useState("");
  const [ackUnusual, setAckUnusual] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const { courseId } = preflight;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const affirmed = typed.trim() === courseId;
  const ackSatisfied = !preflight.unusualCreator || ackUnusual;
  const allowUnusual = preflight.unusualCreator && ackUnusual;
  const confirmEnabled = affirmed && ackSatisfied && !busy;

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    if (e.key === "Escape") {
      if (!busy) onCancel();
      return;
    }
    if (e.key !== "Tab") return;
    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-danger bg-card p-5 shadow-card"
      >
        <h4
          id={titleId}
          className="font-display text-base font-bold text-danger"
        >
          {t("title", { title: courseTitle })}
        </h4>
        <p className="mt-2 text-sm text-text-2">{t("intro")}</p>

        {/* Creator old→new, prominent (immutable). */}
        <div className="mt-3 rounded-md border border-danger bg-danger-light p-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-danger">
            {t("creatorLabel")}
          </p>
          <p className="mt-1 break-all font-mono text-xs text-text-2">
            <span className="text-danger">
              {preflight.creatorOnChain ?? "—"}
            </span>{" "}
            → <span className="text-accent">{preflight.creatorResolved}</span>
          </p>
        </div>

        {preflight.immutableDiffs.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-text">
              {t("immutableHeading")}
            </p>
            <ul className="mt-1 space-y-1 font-mono text-xs text-text-2">
              {preflight.immutableDiffs.map((d) => (
                <li key={d.field}>
                  <span className="text-text-3">{d.field}:</span>{" "}
                  <span className="text-danger">{d.onChainValue}</span> →{" "}
                  <span className="text-accent">{d.contentValue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-3 text-xs text-text-3">
          {t("lessonCountLabel", { count: preflight.liveLessonCount })}
        </p>

        {/* Reset vs preserved (fixed summary). */}
        <div className="mt-3 rounded-md border border-border bg-subtle p-2.5 text-xs">
          <p className="font-semibold text-text">{t("resetHeading")}</p>
          <p className="mt-1 text-text-2">
            {t("resetCounters", {
              completions: preflight.lostCounters.totalCompletions,
              enrollments: preflight.lostCounters.totalEnrollments,
            })}
          </p>
          <p className="mt-2 font-semibold text-text">{t("preserveHeading")}</p>
          <p className="mt-1 text-text-2">{t("preserveList")}</p>
        </div>

        {/* Brief-downtime warning. */}
        <p className="mt-3 rounded-md border border-streak bg-streak-light p-2.5 text-xs text-streak">
          {t("downtimeWarning")}
        </p>

        {/* F4 — second, separate acknowledgement for an unusual creator. */}
        {preflight.unusualCreator && (
          <div className="mt-3 rounded-md border border-danger bg-danger-light p-2.5">
            <p className="text-xs font-semibold text-danger">
              {t("unusualHeading")}
            </p>
            <p className="mt-1 text-xs text-text-2">
              {t("unusualDescription")}
            </p>
            <label className="mt-2 flex items-start gap-2 text-xs text-danger">
              <input
                type="checkbox"
                checked={ackUnusual}
                onChange={(e) => setAckUnusual(e.target.checked)}
                disabled={busy}
                className="mt-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
              />
              <span>{t("unusualAck")}</span>
            </label>
          </div>
        )}

        {/* Type-to-confirm. */}
        <div className="mt-4">
          <label
            htmlFor={`${titleId}-confirm`}
            className="text-xs font-medium text-text"
          >
            {t("confirmLabel")}
          </label>
          <input
            id={`${titleId}-confirm`}
            ref={inputRef}
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={busy}
            autoComplete="off"
            spellCheck={false}
            placeholder={t("confirmPlaceholder", { courseId })}
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-1.5 font-mono text-xs text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-border bg-card px-4 py-1.5 text-xs font-medium text-text shadow-push-sm transition-all hover:bg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-[2px] active:shadow-push-active disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            onClick={() => onConfirm(allowUnusual)}
            disabled={!confirmEnabled}
            className="rounded-md bg-danger px-4 py-1.5 font-display text-xs font-bold text-white shadow-push transition-all duration-100 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger active:translate-y-[3px] active:shadow-push-active disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? t("executing") : t("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
