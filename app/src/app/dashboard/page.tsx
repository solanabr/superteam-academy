import Link from "next/link";
import { Shell } from "@/components/Shell";

export default function DashboardPage() {
  return (
    <Shell
      title="Dashboard"
      subtitle="Your courses, XP, and streak — wired to devnet reads later."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-xs text-zinc-500">XP (stub)</div>
          <div className="mt-2 text-3xl font-semibold">1,250</div>
          <div className="mt-2 text-xs text-zinc-500">Level: 3 (stub)</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-xs text-zinc-500">Streak (stub)</div>
          <div className="mt-2 text-3xl font-semibold">4 days</div>
          <div className="mt-2 text-xs text-zinc-500">UTC day boundary</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-xs text-zinc-500">Rank (stub)</div>
          <div className="mt-2 text-3xl font-semibold">#142</div>
          <div className="mt-2 text-xs text-zinc-500">From leaderboard indexer</div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">Continue learning</div>
            <div className="mt-1 text-sm text-zinc-600">
              Pick up where you left off.
            </div>
          </div>
          <Link className="text-sm underline" href="/courses">
            Browse courses
          </Link>
        </div>
        <div className="mt-4 text-sm text-zinc-500">
          (Next: show enrolled courses + next lesson)
        </div>
      </div>
    </Shell>
  );
}
