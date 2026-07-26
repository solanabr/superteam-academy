"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarCheck } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  trackNextLessonPlanCommitted,
  type PlanWeekday,
} from "@/lib/analytics/events";

/**
 * LX-A6 — session-end if-then plan ("when's your next lesson?"). An
 * implementation-intention prompt: committing to a day + time makes a return
 * markedly more likely (Gollwitzer). v1 is DISPLAY-ONLY — the plan is stored in
 * `profiles.prefs.nextLesson` and shown back here on the next visit; there is no
 * notification channel yet, so nothing delivers a reminder. The plan-completion
 * event's effect on return is a pre-registered NULL in the experiment registry
 * (see `experiment-registry.ts`, id `planning-prompt`).
 *
 * Self-contained slot (LX-B1 additive-slot ethos): it reads and writes its own
 * prefs via the self-service profiles RLS policy (no route, no service role),
 * merging into any other prefs keys rather than clobbering them.
 */

const WEEKDAYS: readonly PlanWeekday[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

const DEFAULT_DAY: PlanWeekday = "tue";
const DEFAULT_TIME = "19:00";

interface NextLessonPref {
  day: PlanWeekday;
  time: string;
}

/** Narrows an untyped prefs blob to a valid stored plan, or null. */
function parseNextLesson(prefs: unknown): NextLessonPref | null {
  if (!prefs || typeof prefs !== "object") return null;
  const nl = (prefs as Record<string, unknown>).nextLesson;
  if (!nl || typeof nl !== "object") return null;
  const day = (nl as Record<string, unknown>).day;
  const time = (nl as Record<string, unknown>).time;
  if (
    typeof day !== "string" ||
    !WEEKDAYS.includes(day as PlanWeekday) ||
    typeof time !== "string" ||
    !/^\d{2}:\d{2}$/.test(time)
  ) {
    return null;
  }
  return { day: day as PlanWeekday, time };
}

function toPrefsObject(prefs: unknown): Record<string, unknown> {
  return prefs && typeof prefs === "object" && !Array.isArray(prefs)
    ? (prefs as Record<string, unknown>)
    : {};
}

/** `mon` → `weekdayMon` (the flat i18n key convention used in the dashboard namespace). */
function weekdayKey(day: PlanWeekday): string {
  return `weekday${day.charAt(0).toUpperCase()}${day.slice(1)}`;
}

interface NextLessonPlanProps {
  userId: string | null;
}

export function NextLessonPlan({ userId }: NextLessonPlanProps) {
  const t = useTranslations("dashboard");

  const [prefs, setPrefs] = useState<Record<string, unknown>>({});
  const [plan, setPlan] = useState<NextLessonPref | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftDay, setDraftDay] = useState<PlanWeekday>(DEFAULT_DAY);
  const [draftTime, setDraftTime] = useState(DEFAULT_TIME);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("prefs")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      const prefsObj = toPrefsObject(data?.prefs);
      setPrefs(prefsObj);
      setPlan(parseNextLesson(prefsObj));
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const openEditor = useCallback(() => {
    setDraftDay(plan?.day ?? DEFAULT_DAY);
    setDraftTime(plan?.time ?? DEFAULT_TIME);
    setEditing(true);
  }, [plan]);

  const handleSave = useCallback(async () => {
    if (!userId) return;
    setSaving(true);
    const nextLesson: NextLessonPref = { day: draftDay, time: draftTime };
    const nextPrefs = { ...prefs, nextLesson };
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      // A plain JSON object; the named NextLessonPref interface lacks the index
      // signature the generated Json type wants, so cast at the boundary.
      .update({ prefs: nextPrefs as unknown as Json })
      .eq("id", userId);
    setSaving(false);
    if (error) return; // best-effort: leave the picker open so the learner can retry
    setPrefs(nextPrefs);
    setPlan(nextLesson);
    setEditing(false);
    trackNextLessonPlanCommitted({ day: draftDay });
  }, [userId, draftDay, draftTime, prefs]);

  // Authenticated dashboard only; nothing to show before the prefs read resolves.
  if (!userId || !loaded) return null;

  const showPicker = editing || !plan;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          <CalendarCheck
            size={20}
            weight="duotone"
            className="shrink-0 text-primary"
            aria-hidden="true"
          />
          <h2 className="font-display text-base font-black tracking-[-0.25px]">
            {t("nextLessonTitle")}
          </h2>
        </div>

        {showPicker ? (
          <>
            <p className="text-sm text-text-3">{t("nextLessonPrompt")}</p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="next-lesson-day"
                  className="text-xs font-semibold text-text-3"
                >
                  {t("nextLessonDayLabel")}
                </label>
                <select
                  id="next-lesson-day"
                  value={draftDay}
                  onChange={(e) => setDraftDay(e.target.value as PlanWeekday)}
                  className="rounded-md border border-border px-2.5 py-1.5 text-sm [background:var(--input)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {WEEKDAYS.map((day) => (
                    <option key={day} value={day}>
                      {t(weekdayKey(day))}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="next-lesson-time"
                  className="text-xs font-semibold text-text-3"
                >
                  {t("nextLessonTimeLabel")}
                </label>
                <input
                  id="next-lesson-time"
                  type="time"
                  value={draftTime}
                  onChange={(e) => setDraftTime(e.target.value)}
                  className="rounded-md border border-border px-2.5 py-1.5 text-sm [background:var(--input)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                />
              </div>
              <Button
                variant="push"
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                {t("nextLessonSave")}
              </Button>
              {plan && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  {t("nextLessonCancel")}
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-text-2">
              {t("nextLessonPlanned", {
                day: t(weekdayKey(plan.day)),
                time: plan.time,
              })}
            </p>
            <Button variant="ghost" size="sm" onClick={openEditor}>
              {t("nextLessonEdit")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
