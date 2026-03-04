import Link from "next/link";
import { Shell } from "@/components/Shell";
import { GamificationOverview } from "@/components/GamificationOverview";
import { OnchainStats } from "@/components/OnchainStats";

export default function DashboardPage() {
  return (
    <Shell
      title="Dashboard"
      subtitle="Your courses, XP, and streak — wired to devnet reads later."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <GamificationOverview />
      </div>

      <div className="mt-8">
        <OnchainStats />
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
