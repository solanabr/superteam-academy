import Link from "next/link";
import { Shell } from "@/components/Shell";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  return (
    <Shell>
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <Link
          href="/leaderboard"
          className="text-xs text-zinc-500 hover:underline"
        >
          ← Leaderboard
        </Link>

        {/* Header */}
        <div className="mt-4 flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 text-xl font-semibold">
            {username[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">@{username}</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Member since Jan 2026 (stub)
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs text-zinc-500">XP</div>
            <div className="mt-1 text-2xl font-semibold">2,450</div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs text-zinc-500">Level</div>
            <div className="mt-1 text-2xl font-semibold">5</div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs text-zinc-500">Courses completed</div>
            <div className="mt-1 text-2xl font-semibold">2</div>
          </div>
        </div>

        {/* Achievements */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Achievements</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {["First Lesson", "3-Day Streak", "SPL Explorer"].map((a) => (
              <span
                key={a}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium"
              >
                🏆 {a}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Achievements will be backed by on-chain cNFTs (devnet).
          </p>
        </div>

        {/* Certificates */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Certificates</h2>
          <div className="mt-4 space-y-3">
            <Link
              href="/certificates/solana-foundations-demo"
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 transition hover:border-zinc-300"
            >
              <div>
                <div className="text-sm font-medium">Solana Foundations</div>
                <div className="mt-0.5 text-xs text-zinc-500">
                  Issued Feb 2026 (stub)
                </div>
              </div>
              <span className="text-xs text-zinc-500">View →</span>
            </Link>
          </div>
        </div>
      </div>
    </Shell>
  );
}
