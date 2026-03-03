"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Github, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";

function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setMessage("");
    try {
      if (supabase) {
        const { error } = await supabase
          .from("newsletter_subscribers")
          .insert({ email });
        if (error) {
          if (error.code === "23505") {
            setMessage("Already subscribed!");
          } else {
            setMessage("Something went wrong. Try again.");
          }
          return;
        }
      }
      setSubscribed(true);
    } catch {
      setMessage("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <p className="text-xs font-mono text-accent">Thanks for subscribing!</p>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
      <p className="text-xs text-muted-foreground font-mono shrink-0">
        Stay updated with Superteam Academy
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 w-full sm:w-auto"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          required
          className="bg-transparent border border-border text-sm font-mono px-3 py-1.5 rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 flex-1 min-w-0"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-1.5 bg-accent/10 border border-accent/30 text-accent text-xs font-mono rounded hover:bg-accent/20 transition-colors whitespace-nowrap disabled:opacity-50"
        >
          {loading ? "..." : "Subscribe"}
        </button>
      </form>
      {message && (
        <p className="text-xs font-mono text-muted-foreground">{message}</p>
      )}
    </div>
  );
}

export function Footer() {
  const pathname = usePathname();

  if (pathname.includes("/lessons/")) return null;

  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-3">
        <FooterNewsletter />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-mono">
            © 2026 Superteam Academy.{" "}
            <span className="text-accent">Built on Solana.</span>
          </p>
          <div className="flex items-center gap-4">
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
      </div>
    </footer>
  );
}
