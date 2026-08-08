"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

/**
 * Email consent toggles.
 *
 * TWO INDEPENDENT CONSENTS, never inferred from one another:
 *   * marketing (#769) — product news / new-course announcements, via
 *     `set_marketing_opt_in`.
 *   * session-plan reminders (#869) — "your next lesson is planned for today",
 *     via `set_reminder_opt_in`. Its RECOMMENDED default is derived from the
 *     learner's committed plan day (`profiles.prefs.nextLesson`, #582): someone
 *     who scheduled a session is shown the switch ON, with the disclosure
 *     spelling out what that means.
 *
 * Both read own-row state from `email_subscriptions` (own-row RLS) and write
 * through SECURITY DEFINER RPCs that stamp the consent timestamps server-side.
 * DB default for both is FALSE: a learner who never touched either toggle is
 * never emailed. The derived default is a UI *suggestion* — the send pipeline
 * gates on the stored `reminder_opt_in` alone, so nothing goes out until the
 * learner actually confirms it here (or at the plan-commit prompt, which shows
 * the same disclosure).
 *
 * "NO REMINDER DECISION YET" IS A TIMESTAMP TEST, NOT ROW ABSENCE.
 * A #779 marketing subscriber already HAS an `email_subscriptions` row with
 * `reminder_opt_in = false` and no reminder timestamps — treating the row's
 * existence as a decision would deny those learners the derived default. The
 * row is "undecided" iff BOTH `reminder_consent_at` and
 * `reminder_unsubscribed_at` are NULL, which only the reminder RPC ever sets.
 *
 * A SUGGESTION MUST BE CONFIRMABLE. While the switch is showing a
 * derived ON, toggling it is the OFF action — so there would be no way to store
 * the ON the learner is looking at. An explicit confirm button is rendered
 * alongside it in exactly that state; it writes the DISPLAYED value.
 */
export function EmailPreferences() {
  const t = useTranslations("settings");
  const locale = useLocale();

  const [optIn, setOptIn] = useState(false);
  const [reminderOptIn, setReminderOptIn] = useState(false);
  /** No consent row yet ⇒ the reminder switch is showing a derived suggestion. */
  const [reminderDerived, setReminderDerived] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (active) setLoaded(true);
          return;
        }
        const [{ data: sub }, { data: profile }] = await Promise.all([
          supabase
            .from("email_subscriptions")
            .select(
              "opt_in, reminder_opt_in, reminder_consent_at, reminder_unsubscribed_at"
            )
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("prefs")
            .eq("id", user.id)
            .maybeSingle(),
        ]);
        if (!active) return;
        setOptIn(sub?.opt_in ?? false);
        if (sub && hasReminderDecision(sub)) {
          setReminderOptIn(sub.reminder_opt_in ?? false);
        } else {
          // No reminder decision recorded — including for a marketing-only
          // subscriber whose row predates any reminder choice. Suggest ON iff a
          // plan day is committed.
          setReminderDerived(true);
          setReminderOptIn(hasCommittedPlan(profile?.prefs));
        }
        setLoaded(true);
      } catch {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleMarketingToggle = async () => {
    if (saving) return;
    const next = !optIn;
    setOptIn(next); // optimistic
    setSaving(true);
    try {
      const { error } = await createClient().rpc("set_marketing_opt_in", {
        p_opt_in: next,
      });
      if (error) {
        setOptIn(!next); // rollback
        console.error("[Settings] Email opt-in failed:", error.message);
      }
    } catch {
      setOptIn(!next); // rollback
    } finally {
      setSaving(false);
    }
  };

  const writeReminderConsent = async (next: boolean) => {
    if (saving) return;
    setReminderOptIn(next); // optimistic
    setSaving(true);
    try {
      const { error } = await createClient().rpc("set_reminder_opt_in", {
        p_opt_in: next,
        // Captured so the cron send (which has no request context) can address
        // the learner in their own language.
        p_locale: locale,
      });
      if (error) {
        setReminderOptIn(!next); // rollback
        console.error("[Settings] Reminder opt-in failed:", error.message);
      } else {
        setReminderDerived(false); // now an explicit, recorded decision
      }
    } catch {
      setReminderOptIn(!next); // rollback
    } finally {
      setSaving(false);
    }
  };

  // Toggling always writes the FLIPPED value…
  const handleReminderToggle = () => writeReminderConsent(!reminderOptIn);
  // …so a derived ON needs its own affordance to store the value on screen.
  const handleReminderConfirm = () => writeReminderConsent(reminderOptIn);

  return (
    <div className="border-t border-border pt-5">
      <p className="set-group-title">{t("emailNotifications")}</p>

      <ToggleRow
        label={t("marketingEmails")}
        description={t("marketingEmailsDesc")}
        checked={optIn}
        disabled={!loaded || saving}
        onToggle={handleMarketingToggle}
      />

      <ToggleRow
        label={t("reminderEmails")}
        description={t("reminderEmailsDesc")}
        note={reminderDerived ? t("reminderEmailsDerived") : undefined}
        checked={reminderOptIn}
        disabled={!loaded || saving}
        onToggle={handleReminderToggle}
        confirm={
          reminderDerived && reminderOptIn
            ? {
                label: t("reminderEmailsConfirm"),
                onConfirm: handleReminderConfirm,
              }
            : undefined
        }
      />
    </div>
  );
}

/**
 * True when the learner has actually DECIDED about reminders. Only
 * `set_reminder_opt_in` / `unsubscribe_reminders_by_token` write these
 * timestamps, so both NULL means "never chose" even on a row created by the
 * #779 marketing toggle.
 */
function hasReminderDecision(sub: {
  reminder_consent_at: string | null;
  reminder_unsubscribed_at: string | null;
}): boolean {
  return (
    sub.reminder_consent_at !== null || sub.reminder_unsubscribed_at !== null
  );
}

/** True when `profiles.prefs.nextLesson.day` holds a committed plan day (#582). */
function hasCommittedPlan(prefs: unknown): boolean {
  if (!prefs || typeof prefs !== "object") return false;
  const nl = (prefs as Record<string, unknown>).nextLesson;
  if (!nl || typeof nl !== "object") return false;
  return typeof (nl as Record<string, unknown>).day === "string";
}

interface ToggleRowProps {
  label: string;
  description: string;
  /** Extra disclosure shown under the description (e.g. a derived default). */
  note?: string;
  /** Action that STORES the currently displayed value (a derived suggestion). */
  confirm?: { label: string; onConfirm: () => void };
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}

function ToggleRow({
  label,
  description,
  note,
  confirm,
  checked,
  disabled,
  onToggle,
}: ToggleRowProps) {
  return (
    <div className="mt-3.5 flex items-center justify-between gap-4">
      <div>
        <p className="set-row-name">{label}</p>
        <p className="set-row-meta">{description}</p>
        {note && <p className="set-row-meta">{note}</p>}
        {confirm && (
          <button
            type="button"
            onClick={confirm.onConfirm}
            disabled={disabled}
            className="mt-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
          >
            {confirm.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="set-switch"
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        <span />
      </button>
    </div>
  );
}
