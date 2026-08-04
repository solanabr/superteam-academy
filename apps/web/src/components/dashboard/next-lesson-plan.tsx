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
  /** Selected weekdays, ordered mon→sun; all 7 = a daily plan (#980). */
  days: PlanWeekday[];
  time: string;
}

/** Narrows an untyped prefs blob to a valid stored plan, or null.
 *
 *  TRANSITION READ (#980 gate F1): until the days[] migration has applied on
 *  prod, stored rows may still carry the legacy `{day}` shape. Read it as
 *  `{days:[day]}` for DISPLAY only — this component always writes `days`, so
 *  the next save upgrades the row. Remove the legacy branch after the
 *  migration is applied + ledgered. */
function parseNextLesson(prefs: unknown): NextLessonPref | null {
  if (!prefs || typeof prefs !== "object") return null;
  const nl = (prefs as Record<string, unknown>).nextLesson;
  if (!nl || typeof nl !== "object") return null;
  const legacyDay = (nl as Record<string, unknown>).day;
  const rawDays = (nl as Record<string, unknown>).days;
  const days =
    rawDays === undefined &&
    typeof legacyDay === "string" &&
    WEEKDAYS.includes(legacyDay as PlanWeekday)
      ? [legacyDay]
      : rawDays;
  const time = (nl as Record<string, unknown>).time;
  if (
    !Array.isArray(days) ||
    days.length === 0 ||
    !days.every(
      (d): d is PlanWeekday =>
        typeof d === "string" && WEEKDAYS.includes(d as PlanWeekday)
    ) ||
    typeof time !== "string" ||
    !/^\d{2}:\d{2}$/.test(time)
  ) {
    return null;
  }
  const ordered = WEEKDAYS.filter((d) => (days as PlanWeekday[]).includes(d));
  return { days: ordered, time };
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
  const [draftDays, setDraftDays] = useState<PlanWeekday[]>([DEFAULT_DAY]);
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
    setDraftDays(plan?.days ?? [DEFAULT_DAY]);
    setDraftTime(plan?.time ?? DEFAULT_TIME);
    setEditing(true);
  }, [plan]);

  const toggleDay = useCallback((day: PlanWeekday) => {
    setDraftDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : WEEKDAYS.filter((d) => prev.includes(d) || d === day)
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!userId) return;
    setSaving(true);
    const nextLesson: NextLessonPref = { days: draftDays, time: draftTime };
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
    // The analytics event predates multi-day plans; report the first selected
    // day so the funnel keeps a stable shape.
    trackNextLessonPlanCommitted({ day: draftDays[0] ?? DEFAULT_DAY });
  }, [userId, draftDays, draftTime, prefs, draftRemind, locale]);

  // Authenticated dashboard only; nothing to show before the prefs read resolves.
  if (!userId || !loaded) return null;

  const showPicker = editing || !plan;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        {showPicker && (
          <div className="flex items-center gap-2">
            <CalendarCheck
              size={16}
              weight="duotone"
              className="shrink-0 text-primary"
              aria-hidden="true"
            />
            <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              {t("nextLessonTitle")}
            </h2>
          </div>
        )}

        {showPicker ? (
          <>
            <p className="text-sm text-text-3">{t("nextLessonPrompt")}</p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <span
                  id="next-lesson-days-label"
                  className="text-xs font-semibold text-text-3"
                >
                  {t("nextLessonDayLabel")}
                </span>
                {/* Recurring by construction: one day, several, or all seven
                    (= daily). The reminder fires on every selected day (#980). */}
                <div
                  role="group"
                  aria-labelledby="next-lesson-days-label"
                  className="flex flex-wrap gap-1.5"
                >
                  {WEEKDAYS.map((day) => {
                    const on = draftDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleDay(day)}
                        className={
                          on
                            ? "rounded-md border border-primary bg-primary px-2 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[1px] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            : "hover:border-primary/50 rounded-md border border-border px-2 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[1px] text-text-3 [background:var(--input)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        }
                      >
                        {t(weekdayKey(day)).slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
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
                disabled={saving || draftDays.length === 0}
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
                {plan.days.length === 7
                  ? t("nextLessonDaily")
                  : plan.days.length <= 3
                    ? plan.days
                        .map((d) => t(weekdayKey(d)).slice(0, 3))
                        .join("\u00B7")
                    : `${plan.days.length}/7`}
              </span>
              <span className="nlp-cal-time">{plan.time}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                {t("nextLessonTitle")}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={openEditor}
                className="-ml-2.5 mt-1"
              >
                {t("nextLessonEdit")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
