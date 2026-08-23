"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Check, ShareNetwork } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/**
 * Share a course with a friend — and carry your referral code while you do it.
 *
 * The link is the course page with `?ref=<code>` appended, which the
 * app-wide ReferralCapture already claims on any page load. So a shared
 * course is a referral: the friend lands on the thing you told them about
 * rather than a generic home page, and the credit still lands.
 *
 * The code is fetched only for signed-in learners — `/api/referrals/me` 401s
 * otherwise. Without one the button still works and shares the plain course
 * link, because "I can't share this" is a worse answer than "shared, but
 * uncredited". Nothing about the control changes between the two states, so
 * a signed-out visitor is never shown a dead affordance.
 */
export function ShareCourseButton({
  courseSlug,
  courseTitle,
  className,
}: {
  courseSlug: string;
  courseTitle: string;
  className?: string;
}) {
  const t = useTranslations("gamification");
  const locale = useLocale();
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/referrals/me")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { code: string }) => {
        if (!cancelled) setCode(data.code);
      })
      .catch(() => {
        // Signed out, or the surface is unavailable — share without a code.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const share = async () => {
    const url =
      `${window.location.origin}/${locale}/courses/${courseSlug}` +
      (code ? `?ref=${code}` : "");
    const text = t("courseShareText", { course: courseTitle });

    // The native sheet where the platform has one — it is what "share with a
    // friend" means on a phone. Clipboard is the desktop fallback.
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: courseTitle, text, url });
        return;
      } catch {
        // Dismissed, or the sheet refused the payload — fall through to copy.
      }
    }

    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard denied; nothing sensible left to try.
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-[var(--r-md)] border-2 border-[var(--ink-line)] px-4 py-2.5 font-display text-sm font-extrabold text-text transition-colors hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className
      )}
    >
      {copied ? (
        <Check size={16} weight="bold" aria-hidden="true" />
      ) : (
        <ShareNetwork size={16} weight="bold" aria-hidden="true" />
      )}
      {copied ? t("courseShareCopied") : t("shareCourse")}
    </button>
  );
}
