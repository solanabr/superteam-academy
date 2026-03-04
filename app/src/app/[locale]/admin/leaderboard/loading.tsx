import type { ReactNode } from "react";
import { AdminLeaderboardSkeleton } from "@/components/admin/leaderboard/leaderboard-skeleton";

export default function AdminLeaderboardLoading(): ReactNode {
  return <AdminLeaderboardSkeleton />;
}
