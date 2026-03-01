"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { X, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY_DISMISSED = "newsletter_dismissed_at";
const STORAGE_KEY_SUBSCRIBED = "newsletter_subscribed";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function NewsletterPopup() {
  const { publicKey } = useWallet();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Never show if already subscribed
    if (localStorage.getItem(STORAGE_KEY_SUBSCRIBED)) return;

    // Never show more than once per day
    const dismissedAt = localStorage.getItem(STORAGE_KEY_DISMISSED);
    if (dismissedAt && Date.now() - Number(dismissedAt) < ONE_DAY_MS) return;

    // Delay appearance by 8s
    const timer = setTimeout(() => setShow(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  // If wallet connects and they've subscribed in DB, hide forever
  useEffect(() => {
    if (!publicKey || !supabase) return;
    supabase
      .from("newsletter_subscribers")
      .select("id")
      .eq("wallet_address", publicKey.toBase58())
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          localStorage.setItem(STORAGE_KEY_SUBSCRIBED, "1");
          setShow(false);
        }
      });
  }, [publicKey]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY_DISMISSED, String(Date.now()));
    setShow(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      if (supabase) {
        await supabase.from("newsletter_subscribers").upsert({
          email,
          wallet_address: publicKey?.toBase58() ?? null,
          subscribed_at: new Date().toISOString(),
        }, { onConflict: "email" });
      }
      localStorage.setItem(STORAGE_KEY_SUBSCRIBED, "1");
      setDone(true);
      setTimeout(() => setShow(false), 2000);
    } catch {
      // still mark as done client-side
      localStorage.setItem(STORAGE_KEY_SUBSCRIBED, "1");
      setDone(true);
      setTimeout(() => setShow(false), 2000);
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-card border border-border rounded-lg shadow-xl p-5 relative">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-[#14F195]/10 border border-[#14F195]/20 flex items-center justify-center shrink-0">
            <Zap className="h-3.5 w-3.5 text-[#14F195]" />
          </div>
          <p className="font-mono text-sm font-semibold text-foreground">Stay updated</p>
        </div>

        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          New courses, Solana ecosystem updates, and XP events — straight to your inbox.
        </p>

        {done ? (
          <p className="text-sm font-mono text-[#14F195] text-center py-1">
            You&apos;re in!
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="flex-1 bg-background border border-border rounded px-3 py-1.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#14F195]/50 transition-colors"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-[#14F195] text-black font-mono font-semibold text-sm rounded-full hover:bg-[#0D9E61] transition-colors disabled:opacity-50 shrink-0"
            >
              {submitting ? "..." : "Join"}
            </button>
          </form>
        )}

        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}
