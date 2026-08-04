"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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
 * markedly more likely (Gollwitzer). The plan is stored in
 * `profiles.prefs.nextLesson` and shown back here on the next visit. The plan-
 * completion event's effect on return is a pre-registered NULL in the experiment
 * registry (see `experiment-registry.ts`, id `planning-prompt`).
 *
 * #869 turned the committed day into a real morning email. This card is the
 * CONSENT CAPTURE for it: a disclosed, default-ON checkbox that writes reminder
 * consent through `set_reminder_opt_in` when the learner saves the plan. Default
 * ON is the "derived from the commitment" default — but it is still only ever
 * WRITTEN by this explicit save, never inferred by the server, and it is
 * independent of the #769 marketing consent in both directions. Unchecking it
 * records an explicit opt-OUT.
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
  const locale = useLocale();

  const [prefs, setPrefs] = useState<Record<string, unknown>>({});
  const [plan, setPlan] = useState<NextLessonPref | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftDay, setDraftDay] = useState<PlanWeekday>(DEFAULT_DAY);
  const [draftTime, setDraftTime] = useState(DEFAULT_TIME);
  // Reminder consent, default ON for a learner who is committing to a day. The
  // stored value wins once a decision exists.
  const [draftRemind, setDraftRemind] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const [{ data }, { data: sub }] = await Promise.all([
        supabase
          .from("profiles")
          .select("prefs")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("email_subscriptions")
          .select(
            "reminder_opt_in, reminder_consent_at, reminder_unsubscribed_at"
          )
          .eq("user_id", userId)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      const prefsObj = toPrefsObject(data?.prefs);
      setPrefs(prefsObj);
      setPlan(parseNextLesson(prefsObj));
      // A recorded decision wins over the default-ON suggestion. "Recorded" is a
      // TIMESTAMP test, not row existence: a #779 marketing-only
      // subscriber already has a row with reminder_opt_in = false and no
      // reminder timestamps, and must still get the default-ON offer.
      if (
        sub &&
        (sub.reminder_consent_at !== null ||
          sub.reminder_unsubscribed_at !== null)
      ) {
        setDraftRemind(sub.reminder_opt_in ?? false);
      }
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
    // Record the reminder decision the learner just saw and confirmed. Failure
    // here leaves consent unchanged (fail-closed: no consent ⇒ no email); the
    // plan itself is already saved, so we do not undo it.
    const { error: consentError } = await supabase.rpc("set_reminder_opt_in", {
      p_opt_in: draftRemind,
      p_locale: locale,
    });
    if (consentError) {
      console.error(
        "[NextLessonPlan] reminder consent failed:",
        consentError.message
      );
    }
    trackNextLessonPlanCommitted({ day: draftDay });
  }, [userId, draftDay, draftTime, prefs, draftRemind, locale]);

  // Authenticated dashboard only; nothing to show before the prefs read resolves.
  if (!userId || !loaded) return null;

  const showPicker = editing || !plan;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        {showPicker && (
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
        )}

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
              {/* Actions pinned to the row's right edge (owner call 04-08). */}
              {plan && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="ml-auto"
                >
                  {t("nextLessonCancel")}
                </Button>
              )}
              <Button
                variant="push"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className={plan ? undefined : "ml-auto"}
              >
                {t("nextLessonSave")}
              </Button>
            </div>
            <label className="flex items-start gap-2 text-sm text-text-3">
              <input
                type="checkbox"
                checked={draftRemind}
                onChange={(e) => setDraftRemind(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />
              <span>{t("nextLessonRemindMe")}</span>
            </label>
          </>
        ) : (
          <div className="flex items-center gap-3.5">
            {/* Mini calendar tile — the plan at a glance. */}
            <span className="nlp-cal" aria-hidden="true">
              <span className="nlp-cal-day">
                {t(weekdayKey(plan.day)).slice(0, 3)}
              </span>
              <span className="nlp-cal-time">{plan.time}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                {t("nextLessonTitle")}
              </p>
              <button
                type="button"
                onClick={openEditor}
                className="mt-1.5 text-xs font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t("nextLessonEdit")}
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
