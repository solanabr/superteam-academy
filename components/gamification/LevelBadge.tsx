"use client";

import { useI18n } from "@/lib/i18n/provider";

type LevelBadgeProps = {
  level: number;
};

export function LevelBadge({ level }: LevelBadgeProps): JSX.Element {
  const { t } = useI18n();

  return (
    <span className="inline-flex rounded-full border px-3 py-1 text-sm font-medium">
      {t("common.level")} {level}
    </span>
  );
}
