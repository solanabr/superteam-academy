"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { GraduationCap, Mail, ArrowRight, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";

/* Inline social icons – avoids extra dep, keeps bundle small */
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export function Footer() {
  const t = useTranslations("footer");
  const tc = useTranslations("common");
  const tl = useTranslations("landing");
  const locale = useLocale();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");

  async function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === "loading") return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), locale }),
      });

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      setStatus(data.alreadySubscribed ? "already" : "success");
      if (!data.alreadySubscribed) setEmail("");

      // Reset to idle after 4 seconds
      setTimeout(() => setStatus("idle"), 4000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    }
  }

  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">{tc("appName")}</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("description")}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("resources")}</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/courses"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {tc("courses")}
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {tc("leaderboard")}
                </Link>
              </li>
              <li>
                <Link
                  href="/community"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {tc("community")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("support")}</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">
                  {t("documentation")}
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  {t("apiReference")}
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  {t("community")}
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("legal")}</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">
                  {t("terms")}
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  {t("privacy")}
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  {t("cookies")}
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("followUs")}</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="https://twitter.com/SuperteamBR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <TwitterIcon className="h-3.5 w-3.5" />
                  Twitter / X
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/superteambrasil"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <DiscordIcon className="h-3.5 w-3.5" />
                  Discord
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/solanabr/superteam-academy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <GitHubIcon className="h-3.5 w-3.5" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter signup */}
        <div className="mt-8 border-t pt-8">
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <Mail className="h-6 w-6 text-primary" />
            <h3 className="mt-2 text-sm font-semibold">{tl("newsletterTitle")}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {tl("newsletterDesc")}
            </p>

            {status === "success" ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Check className="h-4 w-4" />
                {tl("newsletterSuccess")}
              </div>
            ) : status === "already" ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4" />
                {tl("newsletterAlreadySubscribed")}
              </div>
            ) : status === "error" ? (
              <p className="mt-3 text-sm text-destructive">
                {tl("newsletterError")}
              </p>
            ) : (
              <form
                className="mt-3 flex w-full gap-2"
                onSubmit={handleNewsletterSubmit}
              >
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={tl("newsletterPlaceholder")}
                  aria-label={tl("newsletterPlaceholder")}
                  pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                  title="Please enter a valid email (e.g. name@example.com)"
                  className="flex-1 h-9 text-sm"
                  required
                  disabled={status === "loading"}
                />
                <Button
                  type="submit"
                  className="h-9 gap-1.5 px-4 text-sm"
                  disabled={status === "loading"}
                  aria-label={tl("newsletterButton")}
                >
                  {status === "loading" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      {tl("newsletterButton")}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-8 border-t pt-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Powered by</span>
            <Image
              src="/logos/ST-YELLOW-HORIZONTAL.svg"
              alt="Superteam Brasil"
              width={120}
              height={20}
              className="hidden dark:inline-block"
            />
            <Image
              src="/logos/ST-DARK-GREEN-HORIZONTAL.svg"
              alt="Superteam Brasil"
              width={120}
              height={20}
              className="inline-block dark:hidden"
            />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {t("copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
