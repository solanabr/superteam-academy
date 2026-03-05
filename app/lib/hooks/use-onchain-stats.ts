import { useEffect, useState } from "react";
import { onchainQueryService } from "@/lib/services/onchain-queries";

export interface OnchainStats {
	xp: number;
	level: number;
	levelProgress: number;
	xpToNextLevel: number;
	loading: boolean;
}

/**
 * Hook to fetch real-time XP from Solana and calculate level.
 * Level Formula: floor(sqrt(xp / 100))
 */
export function useOnchainStats(walletAddress: string | undefined) {
	const [stats, setStats] = useState<OnchainStats>({
		xp: 0,
		level: 1,
		levelProgress: 0,
		xpToNextLevel: 100,
		loading: !!walletAddress,
	});

	useEffect(() => {
		let isMounted = true;

		if (!walletAddress) {
			const timeout = setTimeout(() => {
				if (isMounted) {
					setStats((prev) =>
						prev.loading ? { ...prev, loading: false } : prev,
					);
				}
			}, 0);
			return () => {
				isMounted = false;
				clearTimeout(timeout);
			};
		}

		const loadingTimeout = setTimeout(() => {
			if (isMounted) {
				setStats((prev) => (prev.loading ? prev : { ...prev, loading: true }));
			}
		}, 0);

		async function fetchStats() {
			try {
				const xp = await onchainQueryService.getXpBalance(walletAddress!);
				if (!isMounted) return;

				const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)));
				const currentLevelXp = Math.pow(level, 2) * 100;
				const nextLevelXp = Math.pow(level + 1, 2) * 100;
				const progressXp = xp - currentLevelXp;
				const totalXpInLevel = nextLevelXp - currentLevelXp;
				const levelProgress = Math.min(
					100,
					(progressXp / totalXpInLevel) * 100,
				);
				const xpToNextLevel = nextLevelXp - xp;

				if (isMounted) {
					setStats({
						xp,
						level,
						levelProgress,
						xpToNextLevel,
						loading: false,
					});
				}
			} catch (error: unknown) {
				if (isMounted) {
					// Ignore abort errors as they are expected on unmount
					if (error instanceof Error && error.name === "AbortError") return;

					console.error("Error in useOnchainStats:", error);
					setStats((prev) => ({ ...prev, loading: false }));
				}
			}
		}

		fetchStats();
		const interval = setInterval(fetchStats, 30000);

		return () => {
			isMounted = false;
			clearTimeout(loadingTimeout);
			clearInterval(interval);
		};
	}, [walletAddress]);

	return stats;
}
