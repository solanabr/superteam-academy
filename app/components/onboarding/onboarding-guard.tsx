"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

interface OnboardingGuardProps {
	children: React.ReactNode;
	requireOnboarding?: boolean;
}

export function OnboardingGuard({ children, requireOnboarding = true }: OnboardingGuardProps) {
	const { user, isAuthenticated } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	// pathname includes locale prefix (e.g. /en/onboarding)
	const isOnboardingPage = /\/onboarding(\/|$)/.test(pathname);

	useEffect(() => {
		if (!isAuthenticated) return;

		const hasCompletedOnboarding = user?.onboardingCompleted;

		if (requireOnboarding && !hasCompletedOnboarding && !isOnboardingPage) {
			router.push("/onboarding");
		} else if (hasCompletedOnboarding && isOnboardingPage) {
			router.push("/profile");
		}
	}, [isAuthenticated, user, router, requireOnboarding, isOnboardingPage]);

	if (!isAuthenticated) {
		return <>{children}</>;
	}

	if (requireOnboarding && !user?.onboardingCompleted && !isOnboardingPage) {
		return (
			<div className="min-h-screen bg-background">
				<div className="mx-auto px-4 sm:px-6 py-8 space-y-6">
					<div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
					<div className="h-4 w-72 bg-muted animate-pulse rounded-lg" />
					<div className="max-w-2xl space-y-4">
						<div className="h-48 bg-muted animate-pulse rounded-xl" />
						<div className="h-12 bg-muted animate-pulse rounded-xl" />
					</div>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}
