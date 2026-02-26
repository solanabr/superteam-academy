"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WelcomeStep } from "@/components/onboarding/welcome-step";
import { ProfileStep } from "@/components/onboarding/profile-step";
import { PreferencesStep } from "@/components/onboarding/preferences-step";
import { GoalsStep } from "@/components/onboarding/goals-step";
import { CompleteStep } from "@/components/onboarding/complete-step";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { useAuth } from "@/contexts/auth-context";

interface OnboardingData {
	username?: string;
	name?: string;
	bio?: string;
	location?: string;
	website?: string;
	title?: string;
	company?: string;
	preferredTopics?: string[];
	learningGoals?: string[];
	experienceLevel?: string;
}

const STEPS = [
	{ id: "welcome", title: "Welcome", component: WelcomeStep },
	{ id: "profile", title: "Profile", component: ProfileStep },
	{ id: "preferences", title: "Preferences", component: PreferencesStep },
	{ id: "goals", title: "Goals", component: GoalsStep },
	{ id: "complete", title: "Complete", component: CompleteStep },
];

export default function OnboardingPage() {
	const [currentStep, setCurrentStep] = useState(0);
	const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
	const router = useRouter();
	const { user, isAuthenticated } = useAuth();

	useEffect(() => {
		if (!isAuthenticated) {
			router.push("/");
			return;
		}

		// Check if user has already completed onboarding
		if (user?.onboardingCompleted) {
			router.push("/profile");
			return;
		}
	}, [isAuthenticated, user, router]);

	const handleNext = (stepData?: Partial<OnboardingData>) => {
		if (stepData) {
			setOnboardingData((prev) => ({ ...prev, ...stepData }));
		}

		if (currentStep < STEPS.length - 1) {
			setCurrentStep(currentStep + 1);
		}
	};

	const handleBack = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const handleComplete = async () => {
		try {
			// Save all onboarding data
			const response = await fetch("/api/onboarding/complete", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...onboardingData,
					onboardingCompleted: true,
					onboardingStep: STEPS.length,
				}),
			});

			if (response.ok) {
				router.push("/profile");
			}
		} catch (error) {
			console.error("Failed to complete onboarding:", error);
		}
	};

	const CurrentStepComponent = STEPS[currentStep].component;

	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto max-w-2xl px-4 py-8">
				<div className="mb-8">
					<OnboardingProgress
						currentStep={currentStep}
						totalSteps={STEPS.length}
						steps={STEPS.map((step) => step.title)}
					/>
				</div>

				<div className="rounded-2xl border border-border/60 bg-card p-8">
					<CurrentStepComponent
						data={onboardingData}
						onNext={handleNext}
						onBack={handleBack}
						onComplete={currentStep === STEPS.length - 1 ? handleComplete : undefined}
					/>
				</div>
			</div>
		</div>
	);
}
