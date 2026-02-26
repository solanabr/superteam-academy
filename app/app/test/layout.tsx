import Link from "next/link";

/**
 * Test-only layout. Used only by /test (and children). Not used by dashboard, courses,
 * certificates, settings, profile, leaderboard, or admin — those use (app)/layout.tsx.
 */
export default function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-900">
      <header className="border-b border-zinc-700 bg-zinc-900/95 sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="font-game text-lg text-zinc-400">
            Academy Test
          </span>
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            ← Home
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
