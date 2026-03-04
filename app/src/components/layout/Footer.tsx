"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/providers/I18nProvider";

export function Footer() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || subscribing) return;

    setSubscribing(true);
    try {
      // For MVP: just show success toast. In production, store in newsletter_subscribers table.
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="md:px-8 w-full max-w-[1800px] mx-auto px-4 mt-20 overflow-hidden border-t border-black dark:border-neutral-700 pt-12 relative">
      {/* Marquee */}
      <div className="w-full overflow-hidden py-10">
        <h1 className="text-[10vw] leading-[0.8] uppercase whitespace-nowrap select-none font-bold text-black dark:text-white tracking-tighter">
          Caminho Academy
        </h1>
      </div>

      {/* Newsletter Signup */}
      <div className="max-w-md mx-auto mb-12 text-center">
        <h3 className="text-sm font-semibold mb-2">Stay in the loop</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          Get updates on new courses, features, and Solana ecosystem news.
        </p>
        <form onSubmit={handleSubscribe} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 px-4 py-2.5 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 transition-all"
          />
          <button
            type="submit"
            disabled={subscribing}
            className="px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-xs font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-all disabled:opacity-50 flex-shrink-0"
          >
            {subscribing ? "..." : "Subscribe"}
          </button>
        </form>
        {subscribed && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 animate-fade-in">
            Thanks for subscribing!
          </p>
        )}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-8 gap-6 pb-12">
        {/* Social Icons */}
        <div className="flex gap-4">
          {/* Twitter / X */}
          <a
            href="https://twitter.com/SuperteamBR"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center border border-neutral-200 dark:border-neutral-700 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:border-black dark:hover:border-white transition-all duration-300"
            aria-label="Twitter"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
            </svg>
          </a>

          {/* Discord */}
          <a
            href="https://discord.gg/superteambrasil"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center border border-neutral-200 dark:border-neutral-700 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:border-black dark:hover:border-white transition-all duration-300"
            aria-label="Discord"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect width="4" height="12" x="2" y="9" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </a>

          {/* GitHub */}
          <a
            href="https://github.com/solanabr/superteam-academy"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center border border-neutral-200 dark:border-neutral-700 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:border-black dark:hover:border-white transition-all duration-300"
            aria-label="GitHub"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </a>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-8 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          <Link
            href="#"
            className="hover:text-black dark:hover:text-white relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-black dark:after:bg-white hover:after:w-full after:transition-all"
          >
            {t("footer.privacyPolicy")}
          </Link>
          <Link
            href="#"
            className="hover:text-black dark:hover:text-white relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-black dark:after:bg-white hover:after:w-full after:transition-all"
          >
            {t("footer.termsOfService")}
          </Link>
          <Link
            href="#"
            className="hover:text-black dark:hover:text-white relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-black dark:after:bg-white hover:after:w-full after:transition-all"
          >
            {t("footer.openSource")}
          </Link>
        </div>

        <div className="text-sm font-medium text-neutral-400">
          &copy; {new Date().getFullYear()} Caminho. Built for Superteam
          Brazil.
        </div>
      </div>
    </footer>
  );
}
