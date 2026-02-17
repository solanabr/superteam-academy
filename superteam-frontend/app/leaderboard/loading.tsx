import { Navbar } from "@/components/navbar";
import { LeaderboardSkeleton } from "@/components/skeletons/leaderboard-skeleton";

export default function Loading() {
  return (
    <div>
      <Navbar />
      <main>
        <LeaderboardSkeleton />
      </main>
    </div>
  );
}
