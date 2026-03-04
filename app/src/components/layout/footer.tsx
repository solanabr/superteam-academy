"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/providers/locale-provider";

function useFooterLinks() {
  const { t } = useLocale();
  return {
    [t("footer.platform")]: [
      { href: "/courses", label: t("nav.courses") },
      { href: "/leaderboard", label: t("nav.leaderboard") },
      { href: "/dashboard", label: t("nav.dashboard") },
    ],
    [t("footer.resources")]: [
      { href: "https://solana.com/docs", label: t("footer.docs") },
      { href: "https://www.anchor-lang.com/", label: "Anchor" },
      {
        href: "https://github.com/solanabr/superteam-academy",
        label: t("footer.github"),
      },
    ],
    [t("footer.community")]: [
      {
        href: "https://discord.gg/superteambrasil",
        label: t("footer.discord"),
      },
      { href: "https://twitter.com/SuperteamBR", label: t("footer.twitter") },
      { href: "https://superteam.fun", label: "Superteam" },
    ],
  };
}

const socialLinks = [
  {
    href: "https://github.com/solanabr/superteam-academy",
    label: "GitHub",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="size-4">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
    ),
  },
  {
    href: "https://discord.gg/superteambrasil",
    label: "Discord",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="size-4">
        <path d="M13.545 2.907a13.227 13.227 0 00-3.257-1.011.05.05 0 00-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 00-3.658 0 8.258 8.258 0 00-.412-.833.051.051 0 00-.052-.025c-1.125.194-2.22.534-3.257 1.011a.046.046 0 00-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 003.995 2.02.05.05 0 00.056-.019c.308-.42.582-.863.818-1.329a.05.05 0 00-.028-.07 8.735 8.735 0 01-1.248-.595.05.05 0 01-.005-.083c.084-.063.168-.129.248-.195a.05.05 0 01.051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 01.053.007c.08.066.164.132.248.195a.05.05 0 01-.004.083c-.399.233-.813.44-1.249.595a.05.05 0 00-.027.07c.24.466.514.909.817 1.329a.05.05 0 00.056.019 13.235 13.235 0 004.001-2.02.049.049 0 00.021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 00-.02-.019zM5.347 10.064c-.79 0-1.44-.726-1.44-1.618 0-.892.637-1.618 1.44-1.618.807 0 1.451.733 1.44 1.618 0 .892-.637 1.618-1.44 1.618zm5.316 0c-.79 0-1.44-.726-1.44-1.618 0-.892.637-1.618 1.44-1.618.807 0 1.451.733 1.44 1.618 0 .892-.64 1.618-1.44 1.618z" />
      </svg>
    ),
  },
  {
    href: "https://twitter.com/SuperteamBR",
    label: "X",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
        <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633z" />
      </svg>
    ),
  },
];

export function Footer() {
  const { t } = useLocale();
  const footerLinks = useFooterLinks();
  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto max-w-5xl px-6 py-16">
        {/* Top section: brand + link columns */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
                <span className="text-xs font-bold text-primary-foreground">
                  S
                </span>
              </div>
              <span className="text-sm font-semibold tracking-tight">
                Superteam Academy
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("footer.description")}
            </p>

            {/* Newsletter */}
            <div className="mt-6">
              <p className="text-xs font-medium text-muted-foreground">
                {t("landing.footerNewsletter")}
              </p>
              <form
                className="mt-2 flex gap-2"
                onSubmit={(e) => e.preventDefault()}
              >
                <label htmlFor="newsletter-email" className="sr-only">
                  {t("landing.footerNewsletter")}
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="you@email.com"
                  className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button size="sm" type="submit">
                  {t("landing.footerSubscribe")}
                </Button>
              </form>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {heading}
              </p>
              <ul className="mt-4 space-y-2.5">
                {(links as { href: string; label: string }[]).map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 sm:flex-row">
          <span className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {t("footer.copyright")}
          </span>
          <div className="flex items-center gap-1">
            {socialLinks.map((link) => (
              <Button key={link.label} variant="ghost" size="icon-sm" asChild>
                <Link
                  href={link.href}
                  aria-label={link.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.icon}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
