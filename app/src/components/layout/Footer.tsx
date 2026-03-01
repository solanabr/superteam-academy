"use client";

import { usePathname } from "next/navigation";
import { Github, ExternalLink } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  if (pathname.includes("/lessons/")) return null;

  return (
    <footer className="border-t border-border mt-auto">
      {/* Bottom links row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-mono">
          © 2026 Superteam Academy.{" "}
          <span className="text-[#14F195]">Built on Solana.</span>
        </p>
        <div className="flex items-center gap-4">
          <a
            href="/community"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
          >
            Community
          </a>
          <a
            href="/admin"
            className="text-xs text-subtle hover:text-muted-foreground transition-colors font-mono"
          >
            Admin
          </a>
          <a
            href="https://github.com/solanabr/superteam-academy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
          >
            <Github className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <a
            href="https://superteam.fun"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Superteam</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
