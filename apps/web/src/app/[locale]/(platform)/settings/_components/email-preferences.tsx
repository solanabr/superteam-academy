"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

/**
 * Marketing-email opt-in toggle (#769). Reads the learner's own opt-in state
 * (own-row RLS on `email_subscriptions`) and writes through the
 * `set_marketing_opt_in` RPC, which stamps the consent timestamp server-side.
 * Default is opt-OUT: a learner with no row reads `false`.
 */
export function EmailPreferences() {
  const t = useTranslations("settings");
  const [optIn, setOptIn] = useState(false);
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
        const { data } = await supabase
          .from("email_subscriptions")
          .select("opt_in")
          .eq("user_id", user.id)
          .maybeSingle();
        if (active) {
          setOptIn(data?.opt_in ?? false);
          setLoaded(true);
        }
      } catch {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleToggle = async () => {
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

  return (
    <div className="border-t border-border pt-4">
      <p className="font-medium">{t("emailNotifications")}</p>
      <div className="mt-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{t("marketingEmails")}</p>
          <p className="text-sm text-text-3">{t("marketingEmailsDesc")}</p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={!loaded || saving}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
            optIn ? "bg-primary" : "bg-subtle"
          }`}
          role="switch"
          aria-checked={optIn}
          aria-label={t("marketingEmails")}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              optIn ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
