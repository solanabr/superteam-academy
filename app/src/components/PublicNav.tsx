"use client"

import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/ThemeToggle"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { useI18n } from "@/components/providers/LocaleProvider"

export function PublicNav() {
  const { t } = useI18n()
  const navLinks = [
    { href: "/#how-it-works", label: t("navPublic.howItWorks", "How it Works") },
    { href: "/#tracks", label: t("navPublic.tracks", "Tracks") },
    { href: "/#features", label: t("navPublic.features", "Features") },
    { href: "/courses", label: t("nav.courses", "Courses") },
    { href: "/leaderboard", label: t("nav.leaderboard", "Leaderboard") },
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="container mx-auto h-16 px-4">
        <div className="grid h-full grid-cols-[1fr_auto] items-center md:grid-cols-[auto_1fr_auto] md:gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-primary/10 ring-1 ring-border">
              <Image
                src="/imgs/logo.png"
                alt="Superteam Academy logo"
                width={32}
                height={32}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <span className="font-bold text-sm hidden sm:block">Superteam Academy</span>
          </Link>

          <div className="hidden items-center justify-center gap-5 md:flex lg:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <LanguageSwitcher compact />
            <ThemeToggle />
            <Link
              href="/sign-in"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
            >
              {t("nav.signIn", "Sign in")}
            </Link>
            <Link
              href="/sign-up"
              className="text-sm font-medium px-3 py-1.5 sm:px-4 rounded-lg bg-primary text-white hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              {t("navPublic.getStarted", "Get Started")}
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}

