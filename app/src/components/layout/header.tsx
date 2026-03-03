"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/courses", label: "Courses" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6 pt-2">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
            <span className="text-xs font-bold text-primary-foreground">S</span>
          </div>
          <span className="text-sm font-semibold tracking-tight">
            Superteam Academy
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" asChild>
              <Link href={link.href} className="text-muted-foreground">
                {link.label}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="hidden size-4 dark:block" />
            <Moon className="block size-4 dark:hidden" />
          </Button>

          <Button size="sm" className="hidden md:inline-flex">
            Connect Wallet
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <nav className="flex flex-col gap-1 pt-8">
                {navLinks.map((link) => (
                  <Button key={link.href} variant="ghost" asChild className="justify-start">
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
                <Button className="mt-4">Connect Wallet</Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
