"use client";

import { useTranslations } from "next-intl";
import { WarningOctagon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * The dashboard's data-fetch error card. Client component only for the retry
 * button (a full reload re-runs the server render).
 */
export function DashboardFetchError() {
  const t = useTranslations("dashboard");
  return (
    <div className="flex items-center justify-center py-20">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <WarningOctagon
            size={48}
            weight="duotone"
            className="text-danger"
            aria-hidden="true"
          />
          <div>
            <h2 className="font-display text-lg font-black">
              {t("fetchError")}
            </h2>
            <p className="mt-1 text-sm text-text-3">{t("fetchErrorDetail")}</p>
          </div>
          <Button variant="push" onClick={() => window.location.reload()}>
            {t("retryLoad")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
