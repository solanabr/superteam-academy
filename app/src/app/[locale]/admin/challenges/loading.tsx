import type { ReactNode } from "react";
import { AdminChallengesSkeleton } from "@/components/admin/challenges/challenges-skeleton";

export default function AdminChallengesLoading(): ReactNode {
  return <AdminChallengesSkeleton />;
}
