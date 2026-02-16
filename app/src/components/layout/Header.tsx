"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { WalletButton } from "@/components/auth/WalletButton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/courses", label: "Curriculum" },
  { href: "/achievements", label: "Achievements" },
  { href: "/settings", label: "Settings" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="glass-panel border-border-subtle sticky top-0 z-20 border-b">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo/logo-horizontal.svg"
            alt="Superteam Academy"
            width={140}
            height={32}
            priority
            className="h-8 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <WalletButton className="hidden sm:inline-flex" />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-label="Toggle menu"
          >
            <span className="text-text-primary text-xl">{mobileOpen ? "✕" : "☰"}</span>
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "glass-panel border-border-subtle border-t md:hidden",
          mobileOpen ? "block" : "hidden"
        )}
      >
        <nav className="flex flex-col gap-1 p-4" aria-label="Mobile">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-text-secondary hover:text-text-primary rounded px-3 py-2 text-sm font-medium hover:bg-surface-high"
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="mt-2 border-t border-border-subtle pt-2">
            <WalletButton className="w-full justify-center" />
          </div>
        </nav>
      </div>
    </header>
  );
}
