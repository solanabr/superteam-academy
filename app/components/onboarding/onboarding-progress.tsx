"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
	currentStep: number;
	totalSteps: number;
	steps: string[];
}

export function OnboardingProgress({ currentStep, totalSteps, steps }: OnboardingProgressProps) {
	return (
		<div
			className="w-full"
			aria-label={`Onboarding progress: step ${currentStep + 1} of ${totalSteps}`}
		>
			<div className="mb-2 overflow-x-auto pb-1">
				<div className="mx-auto flex min-w-max items-center justify-center">
					{steps.map((step, index) => (
						<div key={step} className="flex items-center">
							<div
								className={cn(
									"flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium",
									index < currentStep
										? "border-primary bg-primary text-primary-foreground"
										: index === currentStep
											? "border-primary text-primary"
											: "border-muted-foreground/30 text-muted-foreground"
								)}
							>
								{index < currentStep ? <Check className="h-3 w-3" /> : index + 1}
							</div>
							{index < totalSteps - 1 && (
								<div
									className={cn(
										"h-px w-4 sm:w-6 md:w-8 mx-1",
										index < currentStep
											? "bg-primary"
											: "bg-muted-foreground/30"
									)}
								/>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
