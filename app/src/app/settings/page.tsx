"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@radix-ui/react-label";
import { useUserStore } from "@/lib/store/user-store";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const t = useTranslations("Settings");
  const setTheme = useUserStore((state) => state.setTheme);
  const theme = useUserStore((state) => state.theme);
  const wallet = useWallet();
  const { setTheme: setResolvedTheme } = useTheme();

  const handleThemeChange = (value: "dark" | "light" | "system") => {
    setTheme(value);
    setResolvedTheme(value);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-zinc-100">{t("title")}</h1>
        <p className="mt-2 text-zinc-400">{t("subtitle")}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="border-white/10 bg-zinc-900/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">{t("appearance")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => handleThemeChange("dark")}>Dark</Button>
            <Button variant={theme === "light" ? "default" : "outline"} onClick={() => handleThemeChange("light")}>Light</Button>
            <Button variant={theme === "system" ? "default" : "outline"} onClick={() => handleThemeChange("system")}>System</Button>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-zinc-900/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">{t("wallet")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            <p>Connected: {wallet.connected ? "Yes" : "No"}</p>
            <p className="break-all text-xs text-zinc-500">{wallet.publicKey?.toBase58() ?? "No wallet connected"}</p>
          </CardContent>
        </Card>
      </section>

      <Card className="border-white/10 bg-zinc-900/70">
        <CardHeader>
          <CardTitle className="text-zinc-100">{t("preferences")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-300">
          <div className="flex items-center justify-between"><Label>{t("compactView")}</Label><ToggleDot /></div>
          <div className="flex items-center justify-between"><Label>{t("autoplay")}</Label><ToggleDot active /></div>
          <div className="flex items-center justify-between"><Label>{t("emailUpdates")}</Label><ToggleDot active /></div>
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleDot({ active = false }: { active?: boolean }) {
  return (
    <span className={`inline-flex h-6 w-11 items-center rounded-full ${active ? "bg-[#14F195]/70" : "bg-zinc-700"}`}>
      <span className={`ml-1 h-4 w-4 rounded-full bg-white transition ${active ? "translate-x-5" : ""}`} />
    </span>
  );
}
