"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Brain, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface ReviewStripProps {
  /** Authenticated user id, or null before auth resolves. */
  userId: string | null;
}

/** Up to this many lesson titles are named inline before collapsing to "+N". */
const MAX_TITLES = 3;

/**
 * Dashboard due-review strip (LX-B6). A small additive slot under the Continue
 * card: it names a few due items and deep-links into /review. Reads through
 * `/api/review/due`, which runs the SAME capped `buildReviewSession` as the
 * page (#977: count ≡ what the session serves), and renders nothing when the
 * queue is empty — no empty-state chrome on the dashboard.
 */
export function ReviewStrip({ userId }: ReviewStripProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const [titles, setTitles] = useState<string[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      try {
        // One authoritative read (#977): /api/review/due runs the SAME
        // buildReviewSession the /review page renders, so this badge can
        // never promise an item the session then drops. The previous
        // client-side intersection with lessons-summary used a weaker rule
        // (lesson-in-bundle, no owning-course check) and could over-count.
        const response = await fetch("/api/review/due");
        if (!active) return;
        if (!response.ok) {
          setCount(0);
          setTitles([]);
          return;
        }
        const data = (await response.json()) as {
          count?: number;
          titles?: string[];
        };
        if (!active) return;
        setTitles(Array.isArray(data.titles) ? data.titles : []);
        setCount(typeof data.count === "number" ? data.count : 0);
      } catch {
        if (active) {
          setCount(0);
          setTitles([]);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  // Empty queue → no strip (LX-B6: hidden when the queue is empty).
  if (count === 0) return null;

  const shown = titles.slice(0, MAX_TITLES);
  const overflow = count - shown.length;

  return (
    <section
      aria-label={t("reviewDueAria", { count })}
      className="rounded-xl border border-border bg-card p-4 shadow-card"
    >
      <div className="flex items-center gap-3">
        <span
          className="bg-primary-dim flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary"
          aria-hidden="true"
        >
          <Brain size={18} weight="fill" />
        </span>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          {t("reviewDueTitle", { count })}
        </p>
      </div>

      {/* Name what is actually due — a bare count is a chore, named lessons
          are a plan. Hidden when no item_key resolves (orphaned items, #977). */}
      {shown.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {shown.map((title) => (
            <li
              key={title}
              className="flex items-baseline gap-2 text-sm text-text-2"
            >
              <span
                className="size-1.5 shrink-0 translate-y-[-1px] rounded-full bg-primary"
                aria-hidden="true"
              />
              <span className="truncate">{title}</span>
            </li>
          ))}
          {overflow > 0 && (
            <li className="pl-3.5 text-xs text-text-3">
              {t("reviewMore", { count: overflow })}
            </li>
          )}
        </ul>
      )}

      <Button asChild variant="push" size="sm" className="mt-3.5 w-full">
        <Link href={`/${locale}/review`}>
          {t("reviewNow")}
          <ArrowRight size={15} weight="bold" aria-hidden="true" />
        </Link>
      </Button>
    </section>
  );
}
