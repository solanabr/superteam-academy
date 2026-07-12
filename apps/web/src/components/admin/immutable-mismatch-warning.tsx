"use client";

import { useTranslations } from "next-intl";
import type { DiffEntry } from "@/lib/admin/sync-diff";

interface ImmutableMismatchWarningProps {
  immutableDiffs: DiffEntry[];
  courseTitle: string;
}

/**
 * Loud warning for immutable on-chain fields that differ from the committed
 * content bundle — `update_course` cannot apply them. Remediation is the
 * git/publish-PR path (SP2: the bundle is the source of truth; there is no
 * Sanity Studio to revert in) or a deactivate-and-recreate.
 */
export function ImmutableMismatchWarning({
  immutableDiffs,
  courseTitle,
}: ImmutableMismatchWarningProps) {
  const t = useTranslations("admin.deployScreen.immutableWarning");

  if (immutableDiffs.length === 0) return null;

  // #400: a creator mismatch is the one immutable diff that silently misroutes
  // money — every future creator reward pays the wrong wallet — so it gets its
  // own emphasized line on top of the generic remediation.
  const hasCreatorMismatch = immutableDiffs.some((d) => d.field === "creator");

  return (
    <div className="mt-3 rounded-md border border-danger bg-danger-light p-3 text-sm">
      <p className="mb-2 font-semibold text-danger">{t("heading")}</p>
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
      <p className="mt-2 text-xs text-text-3">
        {t("remediation", { title: courseTitle })}
      </p>
    </div>
  );
}
