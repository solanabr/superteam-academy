"use client";

import { Link } from "@/i18n/navigation";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#050505] text-white">
      <div className="mx-auto max-w-[1400px] px-6 py-14 md:px-12 md:py-20">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div>
              <Link href="/" className="inline-flex items-center gap-2 transition-opacity hover:opacity-75">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <span className="ml-1 text-[15px] font-bold uppercase tracking-[0.2em]">Academy</span>
              </Link>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/60">
                Open-source Solana learning platform focused on practical skills, measurable progress, and verifiable
                on-chain credentials.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.1em] text-white/70">
                  Devnet Ready
                </span>
                <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.1em] text-white/70">
                  Multi-language
                </span>
                <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.1em] text-white/70">
                  Community Built
                </span>
              </div>
            </div>

            <div>
              <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.13em] text-white/40">Platform</p>
              <div className="space-y-3">
                <Link href="/courses" className="block text-[14px] text-white/65 transition-colors hover:text-white">
                  Courses
                </Link>
                <Link href="/dashboard" className="block text-[14px] text-white/65 transition-colors hover:text-white">
                  Dashboard
                </Link>
                <Link href="/leaderboard" className="block text-[14px] text-white/65 transition-colors hover:text-white">
                  Leaderboard
                </Link>
                <Link href="/profile" className="block text-[14px] text-white/65 transition-colors hover:text-white">
                  Profile
                </Link>
              </div>
            </div>

            <div>
              <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.13em] text-white/40">Developers</p>
              <div className="space-y-3">
                <a
                  href="https://docs.solana.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[14px] text-white/65 transition-colors hover:text-white"
                >
                  Solana Docs
                </a>
                <a
                  href="https://www.anchor-lang.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[14px] text-white/65 transition-colors hover:text-white"
                >
                  Anchor
                </a>
                <a
                  href="https://developers.metaplex.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[14px] text-white/65 transition-colors hover:text-white"
                >
                  Metaplex
                </a>
              </div>
            </div>

            <div>
              <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.13em] text-white/40">Community</p>
              <div className="space-y-3">
                <a
                  href="https://x.com/SuperteamBR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[14px] text-white/65 transition-colors hover:text-white"
                >
                  X (SuperteamBR)
                </a>
                <a
                  href="https://github.com/solanabr/superteam-academy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[14px] text-white/65 transition-colors hover:text-white"
                >
                  GitHub Repository
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 md:flex-row">
          <p className="text-[12px] text-white/45">© {new Date().getFullYear()} Superteam Brasil Academy</p>
          <p className="text-[12px] text-white/45">Built for Solana-native developers</p>
        </div>
      </div>
    </footer>
  );
}
