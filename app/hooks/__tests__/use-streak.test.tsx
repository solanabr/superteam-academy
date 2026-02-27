import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { StreakStatus, StreakEventType } from "@superteam-academy/gamification/streak-system";
import { useStreak } from "../use-streak";

const STORAGE_PREFIX = "superteam-academy-streak";

function installLocalStorageMock() {
	const store = new Map<string, string>();

	Object.defineProperty(globalThis, "localStorage", {
		value: {
			getItem: (key: string) => store.get(key) ?? null,
			setItem: (key: string, value: string) => {
				store.set(key, value);
			},
			removeItem: (key: string) => {
				store.delete(key);
			},
			clear: () => {
				store.clear();
			},
		},
		configurable: true,
	});
}

describe("useStreak", () => {
	beforeEach(() => {
		installLocalStorageMock();
	});

	it("awards milestone freeze rewards from engine policy", async () => {
		const userId = "wallet-1";
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const nowIso = new Date().toISOString();

		localStorage.setItem(
			`${STORAGE_PREFIX}:${userId}`,
			JSON.stringify({
				userId,
				currentStreak: 13,
				longestStreak: 13,
				status: StreakStatus.ACTIVE,
				lastActivityDate: yesterday.toISOString(),
				streakStartDate: null,
				freezesAvailable: 0,
				totalFreezesUsed: 0,
				recoveryDeadline: null,
				frozenUntil: null,
				lastUpdated: nowIso,
			})
		);

		const { result } = renderHook(() => useStreak(userId));

		await waitFor(() => {
			expect(result.current.state.currentStreak).toBe(13);
		});

		act(() => {
			result.current.recordActivity(StreakEventType.DAILY_LOGIN);
		});

		await waitFor(() => {
			expect(result.current.state.currentStreak).toBe(14);
			expect(result.current.state.freezesAvailable).toBe(1);
		});
	});

	it("consumes an available freeze through applyFreeze", async () => {
		const userId = "wallet-2";
		const nowIso = new Date().toISOString();

		localStorage.setItem(
			`${STORAGE_PREFIX}:${userId}`,
			JSON.stringify({
				userId,
				currentStreak: 4,
				longestStreak: 7,
				status: StreakStatus.ACTIVE,
				lastActivityDate: nowIso,
				streakStartDate: nowIso,
				freezesAvailable: 1,
				totalFreezesUsed: 0,
				recoveryDeadline: null,
				frozenUntil: null,
				lastUpdated: nowIso,
			})
		);

		const { result } = renderHook(() => useStreak(userId));

		await waitFor(() => {
			expect(result.current.state.freezesAvailable).toBe(1);
		});

		act(() => {
			result.current.applyFreeze();
		});

		await waitFor(() => {
			expect(result.current.state.freezesAvailable).toBe(0);
			expect(result.current.state.status).toBe(StreakStatus.FROZEN);
		});
	});
});
