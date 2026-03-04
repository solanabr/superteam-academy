"use client";
import { Terminal, Menu, Wallet } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { appDomainUrl } from "@/lib/constant";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Courses", href: "/courses" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Profile", href: "/profile" },
  ];

  return (
    <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link className="flex items-center gap-2 group cursor-pointer" href="/">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-tr from-primary to-secondary group-hover:scale-105 transition-transform">
            <Terminal className="w-5 h-5 text-black" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight group-hover:text-primary transition-colors">
            Solana
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              className="text-muted-foreground"
              key={item.href}
              href={item.href}
            >
              {/* <a className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.startsWith(item.href) ? "text-primary" : "text-muted-foreground"
                )}> */}
              {item.label}
              {/* </a> */}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {/* <div className="flex items-center gap-4 px-3 py-1.5 rounded-full border border-white/5 bg-white/5">
            <div className="flex items-center gap-1.5 text-xs font-mono text-primary">
              <Zap className="w-3.5 h-3.5 fill-primary" />
              <span>1,240 XP</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1.5 text-xs font-mono text-orange-400">
              <Trophy className="w-3.5 h-3.5" />
              <span>12 Day Streak</span>
            </div>
          </div> */}

          <Link href={appDomainUrl}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary"
            >
              <Wallet className="w-4 h-4" />
              Connect
            </Button>
          </Link>

          {/* <Link
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            href="/dashboard"
          >
            <User className="w-4 h-4" />
          </Link> */}
        </div>

        {/* Mobile Menu */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="border-l border-white/10 bg-black/95 backdrop-blur-xl"
          >
            <div className="flex flex-col gap-8 mt-8">
              <nav className="flex flex-col gap-4">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <a
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-lg font-medium hover:text-primary transition-colors"
                    >
                      {item.label}
                    </a>
                  </Link>
                ))}
              </nav>
              <Link href={appDomainUrl} className="flex flex-col gap-4">
                <Button className="w-full gap-2 bg-linear-to-r from-primary to-secondary text-black font-bold">
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
