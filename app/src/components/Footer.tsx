"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ExternalLink, ShieldCheck, Sparkles } from "lucide-react"
import { useI18n } from "@/components/providers/LocaleProvider"

export function Footer() {
  const { t } = useI18n()

  const productLinks = [
    { href: "/courses", label: t("footer.links.courses", "Courses") },
    { href: "/leaderboard", label: t("footer.links.leaderboard", "Leaderboard") },
    { href: "/#tracks", label: t("footer.links.learningTracks", "Learning Tracks") },
    { href: "/#how-it-works", label: t("footer.links.howItWorks", "How It Works") },
  ]

  const resourceLinks = [
    { href: "/sign-up", label: t("footer.links.createAccount", "Create Account") },
    { href: "/sign-in", label: t("nav.signIn", "Sign In") },
    { href: "/settings", label: t("nav.settings", "Settings") },
    { href: "/profile", label: t("nav.profile", "Profile") },
  ]

  const communityLinks = [
    { href: "https://superteam.fun/brazil", label: t("footer.links.superteamBrazil", "Superteam Brazil") },
    { href: "https://discord.gg/superteam", label: t("footer.links.discord", "Discord") },
    { href: "https://twitter.com/SuperteamBR", label: t("footer.links.twitter", "Twitter / X") },
  ]

  return (
    <footer className="relative border-t border-border bg-gradient-to-b from-background to-card/30">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_2fr]">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex size-9 items-center justify-center overflow-hidden rounded-lg bg-primary/10 ring-1 ring-border">
                <Image
                  src="/imgs/logo.png"
                  alt="Superteam Academy logo"
                  width={36}
                  height={36}
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="text-base font-semibold text-foreground">Superteam Academy</span>
            </Link>

            <p className="max-w-md text-sm text-muted-foreground">
              {t(
                "footer.description",
                "Solana-native learning for builders. Ship projects, earn XP, and unlock verifiable credentials."
              )}
            </p>

            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" />
              {t("footer.badge", "Devnet-ready learning stack")}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <FooterColumn title={t("footer.columns.platform", "Platform")} links={productLinks} />
            <FooterColumn title={t("footer.columns.account", "Account")} links={resourceLinks} />
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                {t("footer.columns.community", "Community")}
              </h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {communityLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                    >
                      {link.label}
                      <ExternalLink className="size-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card/60 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <ShieldCheck className="size-4 text-primary" />
              {t(
                "footer.securityText",
                "Wallet-first auth, on-chain credentials, and transparent progress."
              )}
            </div>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              {t("footer.startLearning", "Start learning")}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Superteam Academy. {t("footer.rights", "All rights reserved.")}
          </p>
          <div className="flex items-center gap-4">
            <Link href="/#features" className="transition-colors hover:text-foreground">
              {t("navPublic.features", "Features")}
            </Link>
            <Link href="/#how-it-works" className="transition-colors hover:text-foreground">
              {t("navPublic.howItWorks", "How It Works")}
            </Link>
            <Link href="/leaderboard" className="transition-colors hover:text-foreground">
              {t("nav.leaderboard", "Leaderboard")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: Array<{ href: string; label: string }>
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      <ul className="space-y-2.5 text-sm text-muted-foreground">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
