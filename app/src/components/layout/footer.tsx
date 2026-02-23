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
    <footer className="border-t border-white/10 bg-zinc-950/80 px-4 py-8 sm:px-6">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.2fr_2fr]">
        <div className="space-y-4">
          <div>
            <p className="font-mono text-sm font-semibold tracking-[0.2em] text-zinc-100">Superteam Academy</p>
            <p className="mt-2 max-w-sm text-sm text-zinc-400">
              Solana-native LMS for builders shipping production dApps.
            </p>
          </div>

          <Badge className="w-fit border-[#14F195]/35 bg-[#14F195]/10 text-[#14F195]">Built on Solana</Badge>

          <div className="flex items-center gap-2 text-zinc-400">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="rounded-md border border-white/10 p-2 hover:text-white">
              <Github className="size-4" />
            </a>
            <a href="https://x.com" target="_blank" rel="noreferrer" className="rounded-md border border-white/10 p-2 hover:text-white">
              <Twitter className="size-4" />
            </a>
            <a href="https://discord.com" target="_blank" rel="noreferrer" className="rounded-md border border-white/10 p-2 hover:text-white">
              <MessageCircle className="size-4" />
            </a>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold text-zinc-100">{column.title}</p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <Link href={link.href} className="text-sm text-zinc-400 hover:text-zinc-100">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-7xl flex-col gap-1 border-t border-white/10 pt-4 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <span>{t("copyright")}</span>
        <span>© {year} Superteam Academy</span>
      </div>
    </footer>
  );
}
