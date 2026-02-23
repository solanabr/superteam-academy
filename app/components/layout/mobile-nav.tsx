"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("common");

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg p-2 text-content-secondary hover:text-content"
        aria-label="Toggle menu"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-16 border-b border-edge bg-surface/95 backdrop-blur-lg p-4">
          <div className="flex flex-col gap-3">
            <Link href="/" onClick={() => setOpen(false)} className="text-sm text-content-secondary hover:text-content">
              {t("backToCourses")}
            </Link>
            <Link href="/my-learning" onClick={() => setOpen(false)} className="text-sm text-content-secondary hover:text-content">
              {t("dashboard")}
            </Link>
            <Link href="/profile" onClick={() => setOpen(false)} className="text-sm text-content-secondary hover:text-content">
              {t("viewProfile")}
            </Link>
            <Link href="/leaderboard" onClick={() => setOpen(false)} className="text-sm text-content-secondary hover:text-content">
              {t("leaderboard")}
            </Link>
            <Link href="/dashboard" onClick={() => setOpen(false)} className="text-sm text-content-secondary hover:text-content">
              {t("creator")}
            </Link>
            <Link href="/settings" onClick={() => setOpen(false)} className="text-sm text-content-secondary hover:text-content">
              Settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
