"use client";

import { useCallback, useEffect, useState } from "react";
import {
	StreakCalculationEngine,
	StreakStatus,
	StreakEventType,
	type StreakState,
	type StreakEvent,
} from "@superteam-academy/gamification/streak-system";

const STREAK_STORAGE_KEY = "superteam-academy-streak";

function loadStreakState(userId: string): StreakState {
	if (typeof window === "undefined") return createEmptyState(userId);
	try {
		const raw = localStorage.getItem(`${STREAK_STORAGE_KEY}:${userId}`);
		if (!raw) return createEmptyState(userId);
		const parsed = JSON.parse(raw);
		return {
			...parsed,
			lastActivityDate: parsed.lastActivityDate ? new Date(parsed.lastActivityDate) : null,
			streakStartDate: parsed.streakStartDate ? new Date(parsed.streakStartDate) : null,
			recoveryDeadline: parsed.recoveryDeadline ? new Date(parsed.recoveryDeadline) : null,
			frozenUntil: parsed.frozenUntil ? new Date(parsed.frozenUntil) : null,
			lastUpdated: new Date(parsed.lastUpdated),
		};
	} catch {
		return createEmptyState(userId);
	}
}

function saveStreakState(userId: string, state: StreakState): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(`${STREAK_STORAGE_KEY}:${userId}`, JSON.stringify(state));
}

function createEmptyState(userId: string): StreakState {
	return {
		userId,
		currentStreak: 0,
		longestStreak: 0,
		status: StreakStatus.EXPIRED,
		lastActivityDate: null,
		streakStartDate: null,
		freezesAvailable: 0,
		totalFreezesUsed: 0,
		recoveryDeadline: null,
		frozenUntil: null,
		lastUpdated: new Date(),
	};
}

const engine = new StreakCalculationEngine();

function applyEngineRewards(state: StreakState, rewards: Array<{ type: string; value: unknown }>) {
	let nextState = state;

	for (const reward of rewards) {
		if (reward.type !== "freeze_award") continue;
		if (typeof reward.value !== "number") continue;
		if (!Number.isFinite(reward.value) || reward.value <= 0) continue;

		nextState = engine.awardFreezes(nextState, Math.floor(reward.value));
	}

	return nextState;
}

export function useStreak(userId: string | undefined) {
	const [state, setState] = useState<StreakState>(() => createEmptyState(userId ?? "anonymous"));

	// Load from localStorage on mount / userId change
	useEffect(() => {
		if (!userId) return;
		setState(loadStreakState(userId));
	}, [userId]);

	const recordActivity = useCallback(
		(type: StreakEventType = StreakEventType.DAILY_LOGIN) => {
			if (!userId) return;
			setState((previousState) => {
				const event: StreakEvent = {
					id: crypto.randomUUID(),
					userId,
					type,
					timestamp: new Date(),
					activityCount: 1,
				};

				const { newState, rewards } = engine.calculateStreak(previousState, event);
				const rewardedState = applyEngineRewards(newState, rewards);
				saveStreakState(userId, rewardedState);
				return rewardedState;
			});
		},
		[userId]
	);

	const applyFreeze = useCallback(() => {
		if (!userId) return;
		setState((previousState) => {
			// biome-ignore lint/correctness/useHookAtTopLevel: not a hook, just using engine logic
			const result = engine.useFreeze(previousState);
			if (!result.success) {
				return previousState;
			}

			saveStreakState(userId, result.newState);
			return result.newState;
		});
	}, [userId]);

	// Build the StreakData shape expected by StreakTracker component
	const streakData = {
		current: state.currentStreak,
		longest: state.longestStreak,
		lastActivity: state.lastActivityDate?.toISOString() ?? "",
		streakHistory: buildWeekHistory(state),
		weeklyGoal: 7,
		thisWeekActivities:
			state.status === StreakStatus.ACTIVE ? Math.min(state.currentStreak, 7) : 0,
	};

	return { state, streakData, recordActivity, applyFreeze };
}

/** Build a 7-day history from current streak state for the StreakTracker calendar */
function buildWeekHistory(state: StreakState) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const history: Array<{ date: string; activities: number; maintained: boolean }> = [];
	for (let i = 6; i >= 0; i--) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		const iso = d.toISOString().split("T")[0];
		const isActive =
			state.lastActivityDate &&
			state.status === StreakStatus.ACTIVE &&
			state.currentStreak > i;
		history.push({ date: iso, activities: isActive ? 1 : 0, maintained: !!isActive });
	}
	return history;
}
