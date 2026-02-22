"use client";

import React, { useEffect } from "react";
import { StreakTracker } from "@/components/profile/streak-tracker";
import { useStreak } from "@/hooks/use-streak";
import { StreakEventType } from "@superteam-academy/gamification/streak-system";

interface StreakTrackerConnectedProps {
	walletAddress: string | undefined;
}

export function StreakTrackerConnected({ walletAddress }: StreakTrackerConnectedProps) {
	const { streakData, recordActivity } = useStreak(walletAddress);

	// Record a daily login activity on mount
	// Record daily login once on mount
	const recordRef = React.useRef(recordActivity);
	recordRef.current = recordActivity;
	useEffect(() => {
		if (!walletAddress) return;
		recordRef.current(StreakEventType.DAILY_LOGIN);
	}, [walletAddress]);

	return <StreakTracker streakData={streakData} />;
}
