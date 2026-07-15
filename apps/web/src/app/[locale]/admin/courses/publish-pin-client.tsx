"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminCard } from "@/components/admin/admin-card";
import {
  AdminBadge,
  type AdminBadgeTone,
} from "@/components/admin/admin-badge";
import { AdminDisclosure } from "@/components/admin/admin-disclosure";
import type { ChecksState } from "@/lib/github/types";
import {
  computePublishVerdict,
  shortSha,
  contentTreeUrl,
  contentCommitUrl,
  contentCompareUrl,
  suggestBranchName,
  buildLockDiff,
  buildPrTitle,
  buildPrBody,
  buildPublishPrUrl,
  COMPILE_COMMAND,
  LOCK_PATH,
} from "@/lib/github/publish-pin";

interface PinResponse {
  pin: { sha: string; counts: Record<string, number>; compiledAt?: string };
  head: { sha: string; checks: ChecksState };
  verdict: ReturnType<typeof computePublishVerdict>;
  repos: { content: string; app: string };
}

const LINK_CLASSES =
  "font-mono text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm";

const BUTTON_CLASSES =
  "rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-text shadow-push-sm transition-all hover:bg-subtle active:translate-y-[1px] active:shadow-push-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50";

function ChecksBadge({ checks }: { checks: ChecksState }): React.ReactElement {
  const t = useTranslations("admin.publishPin");
  const tone: Record<ChecksState, AdminBadgeTone> = {
    success: "success",
    failure: "danger",
    pending: "warning",
    unknown: "neutral",
  };
  return (
    <AdminBadge tone={tone[checks]} shape="pill">
      {t(`checks.${checks}`)}
    </AdminBadge>
  );
}

function CopyButton({
  text,
  label,
}: {
  text: string;
  label: string;
}): React.ReactElement {
  const t = useTranslations("admin.publishPin");
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (insecure context / denied) — text stays visible
      // and manually selectable, so no error surface is needed.
    }
  }, [text]);
  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={BUTTON_CLASSES}
    >
      {copied ? t("copied") : label}
    </button>
  );
}

/**
 * The publish half of `/admin/courses` (step 1) — the SP3-B "Content pin"
 * card, unchanged from the retired `/admin/publish` screen apart from this
 * move. Shows the pinned courses-academy SHA (from the
 * committed bundle) vs repo HEAD, HEAD's CI state, a drift verdict, and — when
 * drifted — the exact one-line `content.lock` diff, the local rebuild command,
 * and a prefilled PR link. The bump is a one-line HUMAN PR: this card performs
 * no repo write and holds no write token (spec rev-2, locked).
 */
export function PublishPinClient(): React.ReactElement {
  const t = useTranslations("admin.publishPin");
  const [data, setData] = useState<PinResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setUnavailable(false);
    try {
      const res = await fetch("/api/admin/publish/pin");
      if (!res.ok) {
        setUnavailable(true);
        setData(null);
        return;
      }
      setData((await res.json()) as PinResponse);
    } catch {
      setUnavailable(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminCard>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="font-display text-base font-bold text-text">
          {t("title")}
        </h3>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className={BUTTON_CLASSES}
        >
          {t("refresh")}
        </button>
      </div>
      <p className="mb-4 text-sm text-text-3">{t("description")}</p>

      {loading ? (
        <p className="py-6 text-center text-sm text-text-3">{t("loading")}</p>
      ) : unavailable || !data ? (
        <div className="rounded-md border border-streak bg-streak-light p-3 text-sm text-streak">
          {t("unavailable")}
        </div>
      ) : (
        <PinBody data={data} />
      )}
    </AdminCard>
  );
}

function PinBody({ data }: { data: PinResponse }): React.ReactElement {
  const t = useTranslations("admin.publishPin");
  const { pin, head, verdict } = data;
  const drifted = verdict.state === "behind";

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-text-3">
            {t("pinnedSha")}
          </dt>
          <dd className="mt-1">
            <a
              href={contentTreeUrl(pin.sha)}
              target="_blank"
              rel="noreferrer"
              className={LINK_CLASSES}
            >
              {shortSha(pin.sha)}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-text-3">
            {t("headSha")}
          </dt>
          <dd className="mt-1 flex items-center gap-2">
            <a
              href={contentCommitUrl(head.sha)}
              target="_blank"
              rel="noreferrer"
              className={LINK_CLASSES}
            >
              {shortSha(head.sha)}
            </a>
            <ChecksBadge checks={head.checks} />
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-wide text-text-3">
            {t("drift")}
          </dt>
          <dd className="mt-1 text-sm font-medium text-text">
            {verdict.state === "up_to_date"
              ? t("upToDate")
              : verdict.commitsBehind == null
                ? t("behindUnknown")
                : t("behind", { count: verdict.commitsBehind })}
          </dd>
        </div>
      </dl>

      <p className="text-xs text-text-3">
        {t("counts", {
          courses: pin.counts.courses ?? 0,
          lessons: pin.counts.lessons ?? 0,
        })}
      </p>

      {drifted && <PreparePr data={data} />}
    </div>
  );
}

function PreparePr({ data }: { data: PinResponse }): React.ReactElement {
  const t = useTranslations("admin.publishPin");
  const { pin, head, verdict } = data;
  const diff = buildLockDiff(pin.sha, head.sha);
  const title = buildPrTitle(head.sha);
  const body = buildPrBody({
    pinnedSha: pin.sha,
    headSha: head.sha,
    commitsBehind: verdict.commitsBehind,
  });
  const branch = suggestBranchName(head.sha);
  const prUrl = buildPublishPrUrl({ pinnedSha: pin.sha, headSha: head.sha });

  return (
    <div className="border-t border-border pt-4">
      <AdminDisclosure
        headingLevel={4}
        summary={
          <span className="font-display text-sm font-bold text-text">
            {t("prepare.title")}
          </span>
        }
        contentClassName="mt-3 space-y-4"
      >
        {verdict.warnRedHead && (
          <div
            role="alert"
            className="rounded-md border border-danger bg-danger-light p-3 text-sm text-danger"
          >
            {t("prepare.redHeadWarning")}
          </div>
        )}

        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-text-3">
            {t("prepare.step1")}
          </p>
          <pre className="overflow-x-auto rounded-md border border-border bg-card p-3 text-xs">
            <code className="font-mono text-text">{diff}</code>
          </pre>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-text-3">
            {t("prepare.step2")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded-md border border-border bg-card px-2 py-1 font-mono text-xs text-text">
              {COMPILE_COMMAND}
            </code>
            <CopyButton text={COMPILE_COMMAND} label={t("copyCommand")} />
          </div>
          <p className="text-xs text-text-3">
            {t("prepare.step2Hint", { path: LOCK_PATH })}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-text-3">
            {t("prepare.step3")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-text-3">{t("prepare.branch")}</span>
            <code className="rounded-md border border-border bg-card px-2 py-1 font-mono text-xs text-text">
              {branch}
            </code>
            <CopyButton text={branch} label={t("copyBranch")} />
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={title} label={t("copyTitle")} />
            <CopyButton text={body} label={t("copyBody")} />
            <a
              href={contentCompareUrl(pin.sha, head.sha)}
              target="_blank"
              rel="noreferrer"
              className={`${BUTTON_CLASSES} inline-flex items-center`}
            >
              {t("viewCompare")}
            </a>
            <a
              href={prUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-push-sm transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:translate-y-[1px]"
            >
              {t("preparePrLink")}
            </a>
          </div>
        </div>
      </AdminDisclosure>
    </div>
  );
}
