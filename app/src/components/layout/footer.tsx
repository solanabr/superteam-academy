"use client";

import { Badge } from "@/components/ui/badge";
import { Github, MessageCircle, Twitter } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const columns = [
  {
    title: "Platform",
    links: [
      { href: "/courses", label: "Courses" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/leaderboard", label: "Leaderboard" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/courses/solana-fundamentals", label: "Solana Fundamentals" },
      { href: "/courses/anchor-101", label: "Anchor 101" },
      { href: "/courses/security-auditing", label: "Security Auditing" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "/profile/you", label: "Builder Profile" },
      { href: "/leaderboard", label: "Top Learners" },
      { href: "/settings", label: "Preferences" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "#", label: "Terms" },
      { href: "#", label: "Privacy" },
      { href: "#", label: "Code of Conduct" },
    ],
  },
] as const;

export function Footer() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-st-dark/80 px-4 py-8 sm:px-6">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.2fr_2fr]">
        <div className="space-y-4">
          <div>
            <img
              src="/New Logo/Logo/HORIZONTAL/SVG/ST-OFF-WHITE-HORIZONTAL.svg"
              alt="Superteam Brasil"
              className="hidden h-8 dark:block"
            />
            <img
              src="/New Logo/Logo/HORIZONTAL/SVG/ST-DARK-GREEN-HORIZONTAL.svg"
              alt="Superteam Brasil"
              className="block h-8 dark:hidden"
            />
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Superteam Brasil Academy — learn to build production dApps on Solana.
            </p>
          </div>

          <Badge className="w-fit border-[#ffd23f]/35 bg-[#ffd23f]/10 text-[#ffd23f]">Built on Solana</Badge>

          <div className="flex items-center gap-2 text-muted-foreground">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="rounded-md border border-border p-2 hover:text-foreground">
              <Github className="size-4" />
            </a>
            <a href="https://x.com" target="_blank" rel="noreferrer" className="rounded-md border border-border p-2 hover:text-foreground">
              <Twitter className="size-4" />
            </a>
            <a href="https://discord.com" target="_blank" rel="noreferrer" className="rounded-md border border-border p-2 hover:text-foreground">
              <MessageCircle className="size-4" />
            </a>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold text-foreground">{column.title}</p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-7xl flex-col gap-1 border-t border-border pt-4 text-xs text-muted-foreground/70 sm:flex-row sm:items-center sm:justify-between">
        <span>{t("copyright")}</span>
        <span>© {year} Superteam Academy</span>
      </div>
    </footer>
  );
}
