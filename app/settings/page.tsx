"use client";

import { useState } from "react";
import { AccountLinker } from "@/components/auth/AccountLinker";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";

export default function SettingsPage(): JSX.Element {
  const { t } = useI18n();
  const [isPublic, setIsPublic] = useState(true);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-10">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground">{t("settings.subtitle")}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profile")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <label className="grid gap-1 text-sm">
            {t("settings.displayName")}
            <input className="h-10 rounded-md border bg-background px-3" defaultValue="Gava" />
          </label>
          <label className="grid gap-1 text-sm">
            {t("settings.bio")}
            <textarea className="min-h-24 rounded-md border bg-background px-3 py-2" defaultValue="Solana builder." />
          </label>
          <Button>{t("settings.save")}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.accountLinking")}</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountLinker />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("common.language")} / {t("common.theme")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <LanguageSwitcher />
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.privacy")}</CardTitle>
          <CardDescription>{t("settings.publicProfile")}</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />
            {t("settings.publicProfile")}
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
