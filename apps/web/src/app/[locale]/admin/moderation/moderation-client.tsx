"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FlagsPanel } from "@/components/admin/flags-panel";

/**
 * Thin client wrapper local to the moderation screen: holds the pending-flag
 * count that `FlagsPanel` reports via `onCountChange` (the badge lift that
 * previously lived in the stacked `admin-client.tsx`).
 */
export function ModerationClient() {
  const t = useTranslations("admin");
  const [flagCount, setFlagCount] = useState(0);

  return (
    <section>
      <h2 className="mb-4 font-display text-lg font-bold text-text">
        {t("screens.moderation")}
        {flagCount > 0 && (
          <span className="ml-2 rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">
            {flagCount}
          </span>
        )}
      </h2>
      <div className="rounded-lg border border-border bg-card p-4 shadow-card">
        <FlagsPanel onCountChange={setFlagCount} />
      </div>
    </section>
  );
}
