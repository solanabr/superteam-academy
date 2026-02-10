"use client";

import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { GithubLogo, XLogo, DiscordLogo } from "@phosphor-icons/react";

export function Footer() {
  const t = useTranslations("footer");
  const tA11y = useTranslations("a11y");
  const locale = useLocale();

  return (
    <footer className="border-t-[2.5px] border-border bg-subtle">
      <div className="container py-10 md:py-12">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="flex flex-col items-center gap-3 md:items-start">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <Image
                src="/logo-light.png"
                alt="Solarium"
                width={106}
                height={32}
                className="h-8 w-auto dark:hidden"
              />
              <Image
                src="/logo-dark.png"
                alt="Solarium"
                width={106}
                height={32}
                className="hidden h-8 w-auto dark:block"
              />
            </Link>
            <p className="text-sm leading-relaxed text-text-2">
              {t("tagline")}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/solanabr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-3 transition-colors hover:text-text"
              aria-label={tA11y("github")}
            >
              <GithubLogo size={20} weight="bold" />
            </a>
            <a
              href="https://twitter.com/superteambr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-3 transition-colors hover:text-text"
              aria-label={tA11y("twitter")}
            >
              <XLogo size={20} weight="bold" />
            </a>
            <a
              href="https://discord.gg/superteam"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-3 transition-colors hover:text-text"
              aria-label={tA11y("discord")}
            >
              <DiscordLogo size={20} weight="bold" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
