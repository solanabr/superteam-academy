/**
 * Subscription Hook
 * Manages user subscription state and operations
 */

"use client";

import { useState, useEffect, useCallback } from "react";

interface Subscription {
	id: string;
	planId: string;
	status: "active" | "canceled" | "past_due" | "incomplete";
	currentPeriodStart: Date;
	currentPeriodEnd: Date;
	cancelAtPeriodEnd: boolean;
}

interface SubscriptionStats {
	coursesAccessed: number;
	challengesCompleted: number;
	certificatesEarned: number;
	daysActive: number;
}

interface Plan {
	id: string;
	name: string;
	price: number;
	currency: string;
	features: string[];
}

export function useSubscription(userId: string) {
	const [subscription, setSubscription] = useState<Subscription | null>(null);
	const [plans, setPlans] = useState<Plan[]>([]);
	const [stats, setStats] = useState<SubscriptionStats>({
		coursesAccessed: 0,
		challengesCompleted: 0,
		certificatesEarned: 0,
		daysActive: 0,
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadSubscription = useCallback(async () => {
		if (!userId) return;
		try {
			setLoading(true);
			const response = await fetch(
				`/api/platform/subscription?userId=${encodeURIComponent(userId)}`,
				{ method: "GET", cache: "no-store" },
			);
			if (!response.ok) {
				throw new Error("Unable to load subscription");
			}

			const payload = (await response.json()) as {
				subscription: Omit<Subscription, "currentPeriodStart" | "currentPeriodEnd"> & {
					currentPeriodStart: string;
					currentPeriodEnd: string;
				};
				plans: Plan[];
				stats: SubscriptionStats;
			};

			setSubscription({
				...payload.subscription,
				currentPeriodStart: new Date(payload.subscription.currentPeriodStart),
				currentPeriodEnd: new Date(payload.subscription.currentPeriodEnd),
			});
			setPlans(payload.plans);
			setStats(payload.stats);
			setError(null);
		} catch (_err) {
			setError("Failed to load subscription data");
		} finally {
			setLoading(false);
		}
	}, [userId]);

	useEffect(() => {
		if (userId) {
			loadSubscription();
		}
	}, [loadSubscription, userId]);

	const hasAccessToCourse = useCallback(
		() => {
			if (!subscription) return false;
			if (subscription.planId === "free") return false;
			return subscription.status === "active";
		},
		[subscription]
	);

	const upgradeSubscription = useCallback(
		async (planId: string) => {
			try {
				setLoading(true);
				const response = await fetch("/api/platform/subscription", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ action: "upgrade", userId, planId }),
				});
				if (!response.ok) {
					throw new Error("Unable to upgrade");
				}
				await loadSubscription();
				setError(null);
			} catch (_err) {
				setError("Failed to upgrade subscription");
			} finally {
				setLoading(false);
			}
		},
		[loadSubscription, userId]
	);

	const cancelSubscription = useCallback(async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/platform/subscription", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "cancel", userId }),
			});
			if (!response.ok) {
				throw new Error("Unable to cancel");
			}
			await loadSubscription();
			setError(null);
		} catch (_err) {
			setError("Failed to cancel subscription");
		} finally {
			setLoading(false);
		}
	}, [loadSubscription, userId]);

	const reactivateSubscription = useCallback(async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/platform/subscription", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "reactivate", userId }),
			});
			if (!response.ok) {
				throw new Error("Unable to reactivate");
			}
			await loadSubscription();
			setError(null);
		} catch (_err) {
			setError("Failed to reactivate subscription");
		} finally {
			setLoading(false);
		}
	}, [loadSubscription, userId]);

	const updatePaymentMethod = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
		} catch (_err) {
			setError("Failed to update payment method");
		} finally {
			setLoading(false);
		}
	}, []);

	return {
		subscription,
		plans,
		stats,
		loading,
		error,
		hasAccessToCourse,
		upgradeSubscription,
		cancelSubscription,
		reactivateSubscription,
		updatePaymentMethod,
	};
}
