"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Flag } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const FLAG_REASONS = [
  { value: "spam", labelKey: "reasonSpam" },
  { value: "offensive", labelKey: "reasonOffensive" },
  { value: "off-topic", labelKey: "reasonOffTopic" },
  { value: "other", labelKey: "reasonOther" },
] as const;

/** "Other" means nothing on its own — it needs a sentence a moderator can act on. */
const MIN_OTHER_DETAILS = 10;

/** Server `error` codes and statuses this modal knows how to explain. */
const ERROR_KEYS = {
  signedOut: "reportErrorSignedOut",
  rateLimited: "reportErrorRateLimited",
  alreadyReported: "reportErrorAlreadyReported",
  ownContent: "reportErrorOwnContent",
  detailsRequired: "reportErrorDetailsRequired",
  failed: "reportErrorFailed",
} as const;

type ErrorKind = keyof typeof ERROR_KEYS;

async function classifyFailure(res: Response): Promise<ErrorKind> {
  if (res.status === 401) return "signedOut";
  if (res.status === 429) return "rateLimited";
  let code: unknown;
  try {
    code = (await res.json())?.error;
  } catch {
    // Non-JSON body (gateway error page); fall through to the generic message.
  }
  if (code === "alreadyReported") return "alreadyReported";
  if (code === "ownContent") return "ownContent";
  if (code === "detailsRequired") return "detailsRequired";
  return "failed";
}

interface FlagButtonProps {
  threadId?: string;
  answerId?: string;
}

export function FlagButton({ threadId, answerId }: FlagButtonProps) {
  const t = useTranslations("community");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<ErrorKind | null>(null);

  const detailsRequired = reason === "other";
  const detailsSatisfied =
    !detailsRequired || details.trim().length >= MIN_OTHER_DETAILS;

  const handleSubmit = async () => {
    if (!reason || !detailsSatisfied) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/community/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          answerId,
          reason,
          details: details.trim() || undefined,
        }),
      });

      if (!res.ok) {
        setError(await classifyFailure(res));
        return;
      }

      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setReason("");
        setDetails("");
      }, 2500);
    } catch {
      setError("failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-[var(--text-2)] transition-colors hover:text-[var(--danger)]"
          aria-label={t("report")}
        >
          <Flag size={14} />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("reportContent")}</DialogTitle>
        </DialogHeader>
        {submitted ? (
          <div className="space-y-1 py-4">
            <p className="text-sm text-[var(--primary)]">
              {t("reportSubmitted")}
            </p>
            <p className="text-sm text-[var(--text-2)]">
              {t("reportWhatHappensNext")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <fieldset role="radiogroup" className="space-y-2">
              <legend className="mb-2 text-sm font-medium text-[var(--text)]">
                {t("reportReasonLegend")}
              </legend>
              {FLAG_REASONS.map((r) => (
                <label
                  key={r.value}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <input
                    type="radio"
                    name="flag-reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--text)]">
                    {t(r.labelKey)}
                  </span>
                </label>
              ))}
            </fieldset>
            <div className="space-y-1">
              <label
                htmlFor="flag-details"
                className="block text-sm font-medium text-[var(--text)]"
              >
                {detailsRequired
                  ? t("reportDetailsRequired")
                  : t("additionalDetails")}
              </label>
              <textarea
                id="flag-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={t("additionalDetails")}
                aria-required={detailsRequired}
                className="w-full rounded-md border border-[var(--border-default)] bg-[var(--input)] p-2 text-sm text-[var(--text)] placeholder:text-[var(--text-2)] focus:outline-none"
                rows={3}
                maxLength={1000}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-[var(--danger)]">
                {t(ERROR_KEYS[error])}
              </p>
            )}
            <div className="flex justify-end">
              <Button
                variant="destructive"
                onClick={handleSubmit}
                disabled={!reason || !detailsSatisfied || isSubmitting}
              >
                {t("submitReport")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
