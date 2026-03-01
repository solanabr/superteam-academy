import { useQuery } from "@tanstack/react-query";

async function fetchCoursesCompleted(wallet: string): Promise<number> {
  const res = await fetch(`/api/user/${encodeURIComponent(wallet)}/stats`);
  const data = (await res.json()) as { coursesCompleted?: number; error?: string };
  if (!res.ok || data.error) return 0;
  return data.coursesCompleted ?? 0;
}

/**
 * Returns the number of courses completed for a wallet from the indexing DB.
 */
export function useCoursesCompletedFor(walletAddress: string | undefined): { data: number; isLoading: boolean } {
  const { data = 0, isLoading } = useQuery({
    queryKey: ["user-stats", "courses-completed", walletAddress],
    queryFn: () => fetchCoursesCompleted(walletAddress!),
    enabled: !!walletAddress,
  });
  return { data, isLoading };
}
