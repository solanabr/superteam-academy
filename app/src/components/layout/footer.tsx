"use client";

import Link from "next/link";
import { useLocale } from "@/contexts/locale-context";
import { Zap } from "lucide-react";

export function Footer() {
  const { t } = useLocale();

  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">
                Superteam<span className="text-violet-500">Academy</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold">{t("footer.resources")}</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="https://github.com/solanabr/superteam-academy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("footer.github")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("footer.documentation")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("footer.discord")}
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-sm font-semibold">{t("footer.community")}</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/leaderboard"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("footer.leaderboard")}
                </Link>
              </li>
              <li>
                <Link
                  href="/courses"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("footer.courses")}
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("footer.blog")}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold">{t("footer.legal")}</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("footer.terms")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("footer.privacy")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Superteam Academy. MIT License.
          </p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            {t("footer.builtOn")}{" "}
            <span className="font-medium text-foreground">Solana</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
