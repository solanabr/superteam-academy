"use client";

import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { GithubLogo, XLogo, DiscordLogo } from "@phosphor-icons/react";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tA11y = useTranslations("a11y");
  const locale = useLocale();

  return (
    <footer className="border-t-[2.5px] border-border bg-subtle">
      <div className="container px-4 py-10 sm:px-8 md:py-12">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="flex flex-col items-center gap-3 md:items-start">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <Image
                src="/ST-DARK-GREEN-HORIZONTAL.png"
                alt="Superteam Brasil"
                width={160}
                height={32}
                className="h-6 w-auto dark:hidden"
              />
              <Image
                src="/ST-YELLOW-HORIZONTAL.png"
                alt="Superteam Brasil"
                width={160}
                height={32}
                className="hidden h-6 w-auto dark:block"
              />
            </Link>
            <p className="max-w-[280px] text-center text-sm leading-relaxed text-text-2 md:max-w-none md:text-left">
              {t("tagline")}
            </p>
            <p className="text-xs text-text-3">{t("languages")}</p>
          </div>

          <div className="flex flex-col items-center gap-4 md:items-end">
            {/* Quick links */}
            <nav className="flex flex-wrap items-center gap-1 text-sm font-medium">
              <Link
                href={`/${locale}/courses`}
                className="inline-flex min-h-[44px] items-center px-3 text-text-3 transition-colors hover:text-text"
              >
                {t("platform")}
              </Link>
              <Link
                href={`/${locale}/community`}
                className="inline-flex min-h-[44px] items-center px-3 text-text-3 transition-colors hover:text-text"
              >
                {t("community")}
              </Link>
              <Link
                href={`/${locale}/leaderboard`}
                className="inline-flex min-h-[44px] items-center px-3 text-text-3 transition-colors hover:text-text"
              >
                {tNav("leaderboard")}
              </Link>
            </nav>

            {/* Social icons */}
            <div className="flex items-center gap-1">
              <a
                href="https://github.com/solanabr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center text-text-3 transition-colors hover:text-text"
                aria-label={tA11y("github")}
              >
                <GithubLogo size={20} weight="bold" />
              </a>
              <a
                href="https://x.com/superteambr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center text-text-3 transition-colors hover:text-text"
                aria-label={tA11y("twitter")}
              >
                <XLogo size={20} weight="bold" />
              </a>
              <a
                href="https://discord.gg/superteam"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center text-text-3 transition-colors hover:text-text"
                aria-label={tA11y("discord")}
              >
                <DiscordLogo size={20} weight="bold" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
