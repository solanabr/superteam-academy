"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";

interface OnboardingGuardProps {
	children: React.ReactNode;
	requireOnboarding?: boolean;
}

export function OnboardingGuard({ children, requireOnboarding = false }: OnboardingGuardProps) {
	const { user, isAuthenticated } = useAuth();
	const [completedLocally, setCompletedLocally] = useState(false);

	const shouldShowModal =
		isAuthenticated && requireOnboarding && !user?.onboardingCompleted && !completedLocally;

	return (
		<>
			{children}
			{shouldShowModal ? (
				<OnboardingModal onCompleted={() => setCompletedLocally(true)} />
			) : null}
		</>
	);
}
