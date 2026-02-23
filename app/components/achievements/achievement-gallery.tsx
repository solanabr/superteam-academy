"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getMockAchievements } from "@/lib/achievements";
import { AchievementCard } from "./achievement-card";

export function AchievementGallery() {
  const t = useTranslations("achievements");
  const pathname = usePathname();
  const locale = routing.locales.find((l) => pathname.startsWith(`/${l}`)) ?? routing.defaultLocale;

  const achievements = getMockAchievements(locale);

  if (!achievements.length) {
    return (
      <p className="py-8 text-center text-sm text-content-muted">
        {t("noAchievements")}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {achievements.map((a, i) => (
        <AchievementCard key={a.id} achievement={a} locale={locale} index={i} />
      ))}
    </div>
  );
}
