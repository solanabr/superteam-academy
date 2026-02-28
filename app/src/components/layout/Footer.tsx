"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Github, ExternalLink } from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  if (pathname.includes("/lessons/")) return null;

  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="border-t border-border mt-auto">
      {/* Newsletter section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-mono text-sm font-semibold text-foreground">Stay updated</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Get notified about new courses and Solana ecosystem updates.
            </p>
          </div>
          {subscribed ? (
            <p className="text-sm font-mono text-[#14F195] shrink-0">
              Thanks for subscribing!
            </p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2 w-full sm:w-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@solana.com"
                required
                className="flex-1 sm:w-56 bg-card border border-border rounded px-3 py-1.5 text-sm font-mono text-foreground placeholder-[#444444] focus:outline-none focus:border-[#14F195]/50 transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#14F195] text-black font-mono font-semibold text-sm rounded-full hover:bg-accent-dim transition-colors shrink-0"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>

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
