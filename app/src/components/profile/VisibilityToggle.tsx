"use client";

import { useState, useEffect } from "react";
import { upsertProfile } from "@/lib/supabase";

const STORAGE_KEY = "profile:visibility";

export function VisibilityToggle({ walletAddress }: { walletAddress?: string }) {
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsPublic(stored === "public");
    }
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !isPublic;
    setIsPublic(next);
    localStorage.setItem(STORAGE_KEY, next ? "public" : "private");
    // Fire-and-forget Supabase update (best-effort)
    if (walletAddress) {
      upsertProfile({ walletAddress, isPublic: next }).catch(() => {});
    }
  };

  if (!mounted) {
    return (
      <div className="h-7 w-24 rounded border border-[#1F1F1F] bg-[#111111] animate-pulse" />
    );
  }

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded border text-xs font-mono transition-colors cursor-pointer select-none"
      style={{
        borderColor: isPublic ? "#14F195" : "#1F1F1F",
        color: isPublic ? "#14F195" : "#666666",
        background: isPublic ? "rgba(20,241,149,0.06)" : "#111111",
      }}
      title={isPublic ? "Profile is public — click to make private" : "Profile is private — click to make public"}
    >
      {isPublic ? (
        <>
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          Public
        </>
      ) : (
        <>
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
          </svg>
          Private
        </>
      )}
    </button>
  );
}
