"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ImmutableMismatchWarning } from "./immutable-mismatch-warning";
import type { CourseStatus } from "@/app/[locale]/admin/admin-status-types";

interface DeployChangePreviewProps {
  course: CourseStatus;
  /** Fires the actual sync (`POST /api/admin/courses/sync`) via the parent. */
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Pre-deploy change preview (SP3-C Task 2): before any transaction, show what
 * the deploy will write — the updateable field diffs from the existing diff
 * engine (`diffCourse`, carried on the status payload), the loud
 * `ImmutableMismatchWarning` (which BLOCKS confirm — those need a recreate),
 * and the per-course content commitment drift (`chainDrift`: does this deploy
 * update the on-chain `content_tx_id` to the bundle SHA). No diff engine of
 * its own — pure render over the status record.
 */
export function DeployChangePreview({
  course,
  onConfirm,
  onCancel,
}: DeployChangePreviewProps) {
  const t = useTranslations("admin.deployScreen.preview");
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus lands on a real control when the dialog opens (keyboard/SR users).
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // Modal focus trap: Tab cycles within the dialog so focus can never escape
  // to the page behind it (which would also strand the Escape handler).
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    if (e.key === "Escape") {
      onCancel();
      return;
    }
    if (e.key !== "Tab") return;
    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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

  const updateableDiffs = course.differences.filter((d) => d.updateable);
  const immutableDiffs = course.differences.filter((d) => !d.updateable);
  const blocked = immutableDiffs.length > 0;
  const firstDeploy = course.onChainStatus === "not_deployed";
  const contentStale = course.chainDrift === "content_stale";
  const noChanges =
    !firstDeploy && course.differences.length === 0 && !contentStale;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("title", { title: course.title })}
        className="w-full max-w-lg rounded-lg border border-border bg-card p-5 shadow-card"
      >
        <h4 className="font-display text-base font-bold text-text">
          {t("title", { title: course.title })}
        </h4>

        {firstDeploy && (
          <p className="mt-3 text-sm text-text-2">{t("firstDeploy")}</p>
        )}

        {updateableDiffs.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-text">{t("willWrite")}</p>
            <ul className="mt-1.5 space-y-1 font-mono text-xs text-text-2">
              {updateableDiffs.map((d) => (
                <li key={d.field}>
                  <span className="text-text-3">{d.field}:</span>{" "}
                  <span className="text-danger">{String(d.onChainValue)}</span>{" "}
                  →{" "}
                  <span className="text-success">{String(d.contentValue)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!firstDeploy && contentStale && (
          <p className="mt-3 rounded-md border border-streak bg-streak-light p-2.5 text-xs text-streak">
            {t("contentStale")}
          </p>
        )}

        {noChanges && (
          <p className="mt-3 text-sm text-text-2">{t("noChanges")}</p>
        )}

        {blocked && (
          <>
            <ImmutableMismatchWarning
              immutableDiffs={immutableDiffs}
              courseTitle={course.title}
            />
            <p className="mt-2 text-xs font-medium text-danger">
              {t("blocked")}
            </p>
          </>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="rounded-md border border-border bg-card px-4 py-1.5 text-xs font-medium text-text shadow-push-sm transition-all hover:bg-subtle active:translate-y-[2px] active:shadow-push-active"
          >
            {t("cancel")}
          </button>
          {!blocked && (
            <button
              onClick={onConfirm}
              className="rounded-md bg-primary px-4 py-1.5 font-display text-xs font-bold text-white shadow-push transition-all duration-100 hover:bg-primary-hover active:translate-y-[3px] active:shadow-push-active"
            >
              {noChanges
                ? t("confirmRedeploy")
                : firstDeploy
                  ? t("confirmDeploy")
                  : t("confirmSync")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
