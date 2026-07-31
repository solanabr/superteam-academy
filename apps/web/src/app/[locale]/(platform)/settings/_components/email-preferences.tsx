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
            .select("opt_in, reminder_opt_in")
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
        if (sub) {
          setReminderOptIn(sub.reminder_opt_in ?? false);
        } else {
          // No decision recorded: suggest ON iff a plan day is committed.
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

  const handleReminderToggle = async () => {
    if (saving) return;
    const next = !reminderOptIn;
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

  return (
    <div className="border-t border-border pt-4">
      <p className="font-medium">{t("emailNotifications")}</p>

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
      />
    </div>
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
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}

function ToggleRow({
  label,
  description,
  note,
  checked,
  disabled,
  onToggle,
}: ToggleRowProps) {
  return (
    <div className="mt-3 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-text-3">{description}</p>
        {note && <p className="mt-1 text-xs text-text-3">{note}</p>}
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          checked ? "bg-primary" : "bg-subtle"
        }`}
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
