"use client";

import { Link, usePathname } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";

export function Footer() {
  const pathname = usePathname();
  const t = useTranslations("footer");
  const isLanding = pathname === "/";

  return (
    <footer className="border-t bg-background">
      {isLanding && (
        <div className="relative w-full overflow-hidden h-48 sm:h-64 lg:h-80">
          <Image
            src="/hero-banner.jpg"
            alt="Superteam Brasil"
            width={1280}
            height={400}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className={isLanding ? "grid grid-cols-2 gap-8 md:grid-cols-4" : "grid gap-10 md:grid-cols-[200px_1fr]"}>
          {!isLanding && (
            <div className="overflow-hidden rounded-xl self-start">
              <Image
                src="/hero-banner.jpg"
                alt="Superteam Brasil"
                width={400}
                height={260}
                className="w-full object-cover rounded-xl"
              />
            </div>
          )}

          <div className={isLanding ? "contents" : "grid grid-cols-2 gap-8 md:grid-cols-4"}>
            <div>
              <h3 className="text-sm font-semibold">{t("platform")}</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground">{t("courses")}</Link></li>
                <li><Link href="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground">{t("leaderboard")}</Link></li>
                <li><Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">{t("dashboard")}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t("learningPaths")}</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/courses?track=1" className="text-sm text-muted-foreground hover:text-foreground">{t("anchorFramework")}</Link></li>
                <li><Link href="/courses?track=2" className="text-sm text-muted-foreground hover:text-foreground">{t("rustForSolana")}</Link></li>
                <li><Link href="/courses?track=3" className="text-sm text-muted-foreground hover:text-foreground">{t("defiDevelopment")}</Link></li>
                <li><Link href="/courses?track=4" className="text-sm text-muted-foreground hover:text-foreground">{t("programSecurity")}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t("community")}</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="https://discord.gg/superteambrasil" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">{t("discord")}</a></li>
                <li><a href="https://x.com/SuperteamBR" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">{t("twitter")}</a></li>
                <li><Link href="/community/threads" className="text-sm text-muted-foreground hover:text-foreground">{t("threads")}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t("resources")}</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="https://solana.com/docs" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">{t("documentation")}</a></li>
                <li><a href="https://solana.com/news" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">{t("blog")}</a></li>
                <li><a href="https://github.com/solana-labs/solana/blob/master/CHANGELOG.md" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">{t("changelog")}</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            {t("tagline")}
          </p>
        </div>
      </div>
    </footer>
  );
}
