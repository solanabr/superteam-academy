import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const t = await getTranslations("common");
  return (
    <div className="container max-w-2xl py-8">
      <h1 className="mb-6 text-center text-3xl font-bold text-[hsl(var(--brand-logo-green))] drop-shadow-md">
        {t("settings")}
      </h1>
      <Suspense
        fallback={<div className="h-48 animate-pulse rounded-xl bg-muted" />}
      >
        <SettingsClient />
      </Suspense>
    </div>
  );
}
