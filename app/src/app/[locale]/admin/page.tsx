import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function AdminDashboardPage(): Promise<ReactNode> {
  const t = await getTranslations("admin.nav");
  return (
    <div className="space-y-6">
      <h1 className="font-archivo text-xl font-bold uppercase tracking-wide">{t("dashboard")}</h1>
      <p className="font-mono text-sm text-muted-foreground">
        Overview: users, challenges, achievements, leaderboard, certificates, audit logs.
      </p>
      <ul className="flex flex-col gap-2 border border-border p-4 font-mono text-xs">
        <li><Link href="/admin/users" className="underline">{t("users")}</Link></li>
        <li><Link href="/admin/challenges" className="underline">{t("challenges")}</Link></li>
        <li><Link href="/admin/achievements" className="underline">{t("achievements")}</Link></li>
        <li><Link href="/admin/leaderboard" className="underline">{t("leaderboard")}</Link></li>
        <li><Link href="/admin/certificates" className="underline">{t("certificates")}</Link></li>
        <li><Link href="/admin/logs" className="underline">{t("logs")}</Link></li>
      </ul>
    </div>
  );
}
