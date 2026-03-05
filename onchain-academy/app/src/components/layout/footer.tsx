"use client";

import Link from "next/link";
import Image from "next/image";
import { Twitter, Github, Mail } from "lucide-react";
import { useLocale } from "@/providers/locale-provider";
import { Button } from "@/components/ui/button";

export function Footer(): React.JSX.Element {
  const { t } = useLocale();

  return (
    <footer className="border-t border-border/40 bg-background/50 backdrop-blur-3xl pt-16 pb-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-2.5 mb-4 group inline-flex"
            >
              <Image
                src="/superteam-logo.svg"
                alt="Superteam"
                width={132}
                height={28}
                className="h-7 w-auto"
              />
              <span className="font-display text-lg font-semibold tracking-tight text-primary">
                Academy
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed mb-6">
              {t("footer.description")}
            </p>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Link
                href="https://twitter.com/SuperteamBR"
                target="_blank"
                className="hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="https://github.com/solanabr/superteam-academy"
                target="_blank"
                className="hover:text-primary transition-colors"
              >
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">
              {t("footer.platform")}
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/courses"
                  className="hover:text-primary transition-colors"
                >
                  {t("footer.courses")}
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="hover:text-primary transition-colors"
                >
                  {t("footer.leaderboard")}
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-primary transition-colors"
                >
                  {t("footer.achievements")}
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/solanabr/superteam-academy"
                  target="_blank"
                  className="hover:text-primary transition-colors"
                >
                  {t("footer.sourceCode")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">
              {t("footer.stayLooped")}
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              {t("footer.newsletterCopy")}
            </p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder={t("footer.emailPlaceholder")}
                  className="w-full bg-background/50 border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                />
              </div>
              <Button
                size="sm"
                className="bg-primary/10 text-primary hover:bg-primary/20"
              >
                {t("footer.subscribe")}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border/40 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Superteam Academy. {t("footer.rights")}
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="#" className="hover:text-foreground transition-colors">
              {t("footer.privacyPolicy")}
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              {t("footer.termsOfService")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
