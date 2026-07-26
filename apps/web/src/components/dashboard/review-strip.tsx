"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Brain, ArrowRight } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { getDueReviewItems } from "@/lib/review/due-items";
import { getLessonsByIds } from "@/lib/content/client-queries";

interface ReviewStripProps {
  /** Authenticated user id, or null before auth resolves. */
  userId: string | null;
}

/** Up to this many lesson titles are named inline before collapsing to "+N". */
const MAX_TITLES = 3;

/**
 * Dashboard due-review strip (LX-B6). A small additive slot under the Continue
 * card: it names a few due items and deep-links into /review. Reads the queue
 * through the SAME capped `getDueReviewItems` primitive as the page (never more
 * than `REVIEW_SESSION_CAP`), and renders nothing when the queue is empty — no
 * empty-state chrome on the dashboard.
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
        const supabase = createClient();
        const due = await getDueReviewItems(supabase, userId);
        if (!active) return;
        if (due.length === 0) {
          setCount(0);
          setTitles([]);
          return;
        }
        const lessons = await getLessonsByIds(due.map((d) => d.item_key));
        if (!active) return;
        const byId = new Map(lessons.map((l) => [l._id, l.title]));
        setTitles(
          due
            .map((d) => byId.get(d.item_key))
            .filter((x): x is string => Boolean(x))
        );
        setCount(due.length);
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
    <Link
      href={`/${locale}/review`}
      aria-label={t("reviewDueAria", { count })}
      className="hover:border-primary/40 group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span
        className="bg-primary-dim flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary"
        aria-hidden="true"
      >
        <Brain size={20} weight="fill" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          {t("reviewDueTitle", { count })}
        </p>
        {shown.length > 0 && (
          <p className="mt-0.5 truncate text-sm text-text-2">
            {shown.join(" · ")}
            {overflow > 0 && (
              <span className="text-text-3">
                {" "}
                {t("reviewMore", { count: overflow })}
              </span>
            )}
          </p>
        )}
      </div>
      <span
        className="flex shrink-0 items-center gap-1.5 font-display text-sm font-extrabold text-primary transition-transform duration-200 group-hover:translate-x-0.5"
        aria-hidden="true"
      >
        <span className="hidden sm:inline">{t("reviewNow")}</span>
        <ArrowRight size={15} weight="bold" />
      </span>
    </Link>
  );
}
