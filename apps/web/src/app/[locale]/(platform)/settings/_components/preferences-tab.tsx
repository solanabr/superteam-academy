"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { locales, localeNames } from "@/lib/i18n/config";

export function PreferencesTab() {
  const t = useTranslations("settings");
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{t("theme")}</p>
            <p className="text-sm text-text-3">
              {t("darkMode")} / {t("lightMode")}
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="space-y-3">
          <p className="font-medium">{t("language")}</p>
          <div className="flex gap-2">
            {locales.map((loc) => (
              <Button
                key={loc}
                variant="outline"
                size="sm"
                onClick={() => switchLocale(loc)}
              >
                {localeNames[loc]}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
