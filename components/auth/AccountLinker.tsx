"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

export function AccountLinker(): JSX.Element {
  const { t } = useI18n();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-md border p-3">
        <span className="text-sm">{t("auth.google")}</span>
        <Button size="sm" variant="outline">
          {t("auth.link")}
        </Button>
      </div>
      <div className="flex items-center justify-between rounded-md border p-3">
        <span className="text-sm">{t("auth.github")}</span>
        <Button size="sm" variant="outline">
          {t("auth.link")}
        </Button>
      </div>
    </div>
  );
}
