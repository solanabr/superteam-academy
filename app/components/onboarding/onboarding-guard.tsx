"use client";

import { useAuth } from "@/contexts/auth-context";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";

interface OnboardingGuardProps {
	children: React.ReactNode;
	requireOnboarding?: boolean;
}

export function OnboardingGuard({ children, requireOnboarding = false }: OnboardingGuardProps) {
	const { user, isAuthenticated, refreshSession } = useAuth();

	const shouldShowModal =
		isAuthenticated && requireOnboarding && user !== null && user.onboardingCompleted === false;

	return (
		<>
			{children}
			{shouldShowModal ? <OnboardingModal onCompleted={refreshSession} /> : null}
		</>
	);
}
