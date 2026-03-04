"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Github, Twitter, Mail } from "lucide-react";

function NewsletterForm() {
  const t = useTranslations("landing.footer");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok || res.status === 409) {
        setSubmitted(true);
        setEmail("");
      }
    } catch {
      // Silently fail — the form will remain visible for retry
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <p className="text-sm text-brazil-green font-medium">{t("subscribed")}</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:border-st-green focus:outline-none focus:ring-1 focus:ring-st-green"
        />
      </div>
      <button
        type="submit"
        className="h-10 rounded-lg bg-st-green px-4 text-sm font-semibold text-white transition-colors hover:bg-st-green-dark"
      >
        {t("subscribe")}
      </button>
    </form>
  );
}

export function Footer() {
  const t = useTranslations("landing.footer");

  const platformLinks = [
    { label: t("courses"), href: "/courses" },
    { label: t("leaderboard"), href: "/leaderboard" },
    { label: t("dashboard"), href: "/dashboard" },
    { label: t("certificates"), href: "/dashboard" },
  ];

  const resourceLinks = [
    { label: t("solanaDocs"), href: "https://solana.com/docs" },
    { label: t("anchorBook"), href: "https://www.anchor-lang.com/" },
    { label: t("solanaCookbook"), href: "https://solanacookbook.com/" },
    { label: t("metaplexDocs"), href: "https://developers.metaplex.com/" },
  ];

  const communityLinks = [
    { label: t("discord"), href: "https://discord.gg/superteambrasil" },
    { label: t("twitter"), href: "https://twitter.com/SuperteamBR" },
    {
      label: t("github"),
      href: "https://github.com/solanabr/superteam-academy",
    },
    { label: t("superteamEarn"), href: "https://superteam.fun/earn" },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-border bg-card">
      {/* Decorative background banner */}
      <Image
        src="/capa-nova1.jpg"
        alt=""
        fill
        className="object-cover opacity-20 pointer-events-none"
        priority={false}
      />
      {/* Fade overlay: transparent top → solid card color bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--card)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">
                  ST
                </span>
              </div>
              <span className="font-heading text-lg font-bold">Academy</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("description")}
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href="https://twitter.com/SuperteamBR"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Superteam Brazil on Twitter"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://github.com/solanabr/superteam-academy"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Superteam Academy on GitHub"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold">{t("platform")}</h3>
            <ul className="mt-3 space-y-2">
              {platformLinks.map((link) => (
                <li key={link.href + link.label}>
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

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold">{t("resources")}</h3>
            <ul className="mt-3 space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-sm font-semibold">{t("community")}</h3>
            <ul className="mt-3 space-y-2">
              {communityLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-10 border-t border-border pt-8">
          <div className="mx-auto max-w-md text-center">
            <h3 className="text-sm font-semibold">{t("stayUpdated")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("newsletterDescription")}
            </p>
            <div className="mt-4">
              <NewsletterForm />
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-center text-xs text-muted-foreground">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
