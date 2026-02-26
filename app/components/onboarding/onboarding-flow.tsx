"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { WelcomeStep } from "@/components/onboarding/welcome-step";
import { ProfileStep } from "@/components/onboarding/profile-step";
import { ProfileDetailsStep } from "@/components/onboarding/profile-details-step";
import { PreferencesStep } from "@/components/onboarding/preferences-step";
import { TimeCommitmentStep } from "@/components/onboarding/time-commitment-step";
import { ExperienceStep } from "@/components/onboarding/experience-step";
import { GoalsStep } from "@/components/onboarding/goals-step";
import { CompleteStep } from "@/components/onboarding/complete-step";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";

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
	timeCommitment?: string;
}

const STEPS = [
	{ id: "welcome", component: WelcomeStep },
	{ id: "profile", component: ProfileStep },
	{ id: "profile-details", component: ProfileDetailsStep },
	{ id: "topics", component: PreferencesStep },
	{ id: "time", component: TimeCommitmentStep },
	{ id: "experience", component: ExperienceStep },
	{ id: "goals", component: GoalsStep },
	{ id: "complete", component: CompleteStep },
];

interface OnboardingFlowProps {
	onCompleted?: () => void;
}

export function OnboardingFlow({ onCompleted }: OnboardingFlowProps) {
	const t = useTranslations("onboarding");
	const [currentStep, setCurrentStep] = useState(0);
	const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
	const router = useRouter();

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
				onCompleted?.();
				router.push("/profile");
				router.refresh();
			}
		} catch (error) {
			console.error("Failed to complete onboarding:", error);
		}
	};

	const CurrentStepComponent = STEPS[currentStep].component;

	return (
		<div className="space-y-6">
			<OnboardingProgress
				currentStep={currentStep}
				totalSteps={STEPS.length}
				steps={STEPS.map((step) => t(`steps.${step.id}`))}
			/>

			<div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6 max-h-[62vh] overflow-y-auto">
				<CurrentStepComponent
					data={onboardingData}
					onNext={handleNext}
					onBack={handleBack}
					{...(currentStep === STEPS.length - 1 ? { onComplete: handleComplete } : {})}
				/>
			</div>
		</div>
	);
}
