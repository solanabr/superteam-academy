"use client";

import Link from "next/link";
import { Zap, Twitter, Github, MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

const footerLinks: Record<string, FooterLink[]> = {
  Platform: [
    { label: "Courses", href: "/courses" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Certificates", href: "/certificates" },
  ],
  Community: [
    { label: "Discord", href: "https://discord.gg/superteambrasil", external: true },
    { label: "Twitter", href: "https://twitter.com/SuperteamBR", external: true },
    { label: "GitHub", href: "https://github.com/solanabr/superteam-academy", external: true },
    { label: "Forum", href: "/community" },
  ],
  Resources: [
    { label: "Admin", href: "/admin" },
    { label: "Course Creator (CMS)", href: "/studio" },
    { label: "Documentation", href: "/docs" },
    { label: "Solana Cookbook", href: "https://solanacookbook.com", external: true },
    { label: "Anchor Docs", href: "https://www.anchor-lang.com", external: true },
    { label: "Metaplex Docs", href: "https://developers.metaplex.com", external: true },
  ],
};

export function Footer() {
  return (
    <footer className="relative border-t border-border/50 bg-background">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#9945FF]/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#9945FF] to-[#14F195] rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-lg">
                <span className="gradient-text">Superteam</span>{" "}
                <span className="text-foreground/80">Academy</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              The premier Solana learning platform for Latin American developers.
              Build real dApps, earn on-chain credentials, and join the community.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              <Link
                href="https://twitter.com/SuperteamBR"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </Link>
              <Link
                href="https://github.com/solanabr/superteam-academy"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
              >
                <Github className="h-4 w-4" />
              </Link>
              <Link
                href="https://discord.gg/superteambrasil"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-sm text-foreground mb-4">{category}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      {link.label}
                      {link.external && <ExternalLink className="h-3 w-3" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-sm">
              <h3 className="font-semibold text-sm text-foreground mb-1">Stay Updated</h3>
              <p className="text-xs text-muted-foreground">
                Get the latest courses, Solana news, and platform updates.
              </p>
            </div>
            <form
              className="flex gap-2 w-full md:w-auto"
              onSubmit={(e) => e.preventDefault()}
            >
              <Input
                type="email"
                placeholder="your@email.com"
                className="md:w-64 bg-white/5 border-white/10"
              />
              <Button variant="gradient" size="sm" type="submit">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2024 Superteam Brazil. All rights reserved. MIT License.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <span className="flex items-center gap-1">
              Built on{" "}
              <span className="gradient-text font-semibold">Solana</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
