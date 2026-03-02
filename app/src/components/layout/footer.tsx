"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Github, Twitter } from "lucide-react";

export function Footer() {
  const locale = useLocale();
  const t = useTranslations("common");

  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 font-bold text-lg mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-superteam-purple to-superteam-green" />
              <span className="gradient-text">Superteam Academy</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("footerDescription")}
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href="https://github.com/solanabr/superteam-academy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/superaborabrasil"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Learn */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">{t("learn")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={`/${locale}/courses`}
                  className="hover:text-foreground transition-colors"
                >
                  {t("courses")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/leaderboard`}
                  className="hover:text-foreground transition-colors"
                >
                  {t("leaderboard")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">{t("community")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://discord.gg/superteam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Discord
                </a>
              </li>
              <li>
                <a
                  href="https://superteam.fun"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Superteam
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">{t("resources")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://solana.com/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Solana Docs
                </a>
              </li>
              <li>
                <a
                  href="https://explorer.solana.com/?cluster=devnet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Explorer
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Superteam Brazil. Built on Solana.
          </p>
          <p className="text-xs text-muted-foreground">
            Program:{" "}
            <a
              href="https://explorer.solana.com/address/ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf?cluster=devnet"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono hover:text-foreground transition-colors"
            >
              ACADBRC...3ucf
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
