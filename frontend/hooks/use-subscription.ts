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

	// Mock data - in real app, this would come from API
	useEffect(() => {
		const fetchSubscriptionData = async () => {
			try {
				setLoading(true);

				// Simulate API call
				await new Promise((resolve) => setTimeout(resolve, 1000));

				// Mock subscription data
				const mockSubscription: Subscription = {
					id: "sub_123",
					planId: "premium",
					status: "active",
					currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
					currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
					cancelAtPeriodEnd: false,
				};

				const mockPlans: Plan[] = [
					{
						id: "free",
						name: "Free",
						price: 0,
						currency: "USD",
						features: [
							"5 courses",
							"2 challenges",
							"1 certificate",
							"Community support",
						],
					},
					{
						id: "premium",
						name: "Premium",
						price: 29,
						currency: "USD",
						features: [
							"Unlimited courses",
							"Unlimited challenges",
							"Unlimited certificates",
							"Priority support",
							"Advanced analytics",
							"Downloadable content",
							"Ad-free experience",
						],
					},
					{
						id: "pro",
						name: "Pro",
						price: 99,
						currency: "USD",
						features: [
							"Everything in Premium",
							"Team collaboration",
							"API access",
							"White-label options",
							"Dedicated support",
						],
					},
					{
						id: "enterprise",
						name: "Enterprise",
						price: 0,
						currency: "USD",
						features: [
							"Everything in Pro",
							"SSO integration",
							"Advanced audit logs",
							"Compliance reporting",
							"On-premise deployment",
							"Custom integrations",
						],
					},
				];

				const mockStats: SubscriptionStats = {
					coursesAccessed: 12,
					challengesCompleted: 8,
					certificatesEarned: 3,
					daysActive: 45,
				};

				setSubscription(mockSubscription);
				setPlans(mockPlans);
				setStats(mockStats);
				setError(null);
			} catch (_err) {
				setError("Failed to load subscription data");
			} finally {
				setLoading(false);
			}
		};

		if (userId) {
			fetchSubscriptionData();
		}
	}, [userId]);

	const hasAccessToCourse = useCallback(
		(_courseId: string) => {
			if (!subscription) return false;

			// Free users have limited access
			if (subscription.planId === "free") {
				// Mock logic - in real app, check against user's accessed courses
				return Math.random() > 0.7; // 30% chance for demo
			}

			// Premium and above have full access
			return subscription.status === "active";
		},
		[subscription]
	);

	const upgradeSubscription = useCallback(
		async (planId: string) => {
			try {
				setLoading(true);

				// Simulate API call
				await new Promise((resolve) => setTimeout(resolve, 2000));

				// Update subscription
				if (subscription) {
					setSubscription((prev) => (prev ? { ...prev, planId } : null));
				}

				setError(null);
			} catch (_err) {
				setError("Failed to upgrade subscription");
			} finally {
				setLoading(false);
			}
		},
		[subscription]
	);

	const cancelSubscription = useCallback(async () => {
		try {
			setLoading(true);

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1500));

			// Update subscription
			if (subscription) {
				setSubscription((prev) =>
					prev
						? {
								...prev,
								status: "canceled",
								cancelAtPeriodEnd: true,
							}
						: null
				);
			}

			setError(null);
		} catch (_err) {
			setError("Failed to cancel subscription");
		} finally {
			setLoading(false);
		}
	}, [subscription]);

	const reactivateSubscription = useCallback(async () => {
		try {
			setLoading(true);

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1500));

			// Update subscription
			if (subscription) {
				setSubscription((prev) =>
					prev
						? {
								...prev,
								status: "active",
								cancelAtPeriodEnd: false,
							}
						: null
				);
			}

			setError(null);
		} catch (_err) {
			setError("Failed to reactivate subscription");
		} finally {
			setLoading(false);
		}
	}, [subscription]);

	const updatePaymentMethod = useCallback(async () => {
		try {
			setLoading(true);

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// In real app, this would open a payment method update flow
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
