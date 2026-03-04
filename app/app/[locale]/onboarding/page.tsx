"use client";

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function OnboardingPage() {
	return (
		<AuthGuard>
			<div className="min-h-screen bg-background">
				<div className="mx-auto max-w-2xl px-4 py-8">
					<OnboardingFlow />
				</div>
			</div>
		</AuthGuard>
	);
}
