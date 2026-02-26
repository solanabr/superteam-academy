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
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		);
	}

	return <>{children}</>;
}
