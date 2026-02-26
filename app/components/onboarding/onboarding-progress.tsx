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
		<div className="w-full">
			<div className="flex items-center justify-between mb-4">
				{steps.map((step, index) => (
					<div key={step} className="flex items-center">
						<div
							className={cn(
								"flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium",
								index < currentStep
									? "border-primary bg-primary text-primary-foreground"
									: index === currentStep
										? "border-primary text-primary"
										: "border-muted-foreground/30 text-muted-foreground"
							)}
						>
							{index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
						</div>
						{index < totalSteps - 1 && (
							<div
								className={cn(
									"h-0.5 w-16 mx-2",
									index < currentStep ? "bg-primary" : "bg-muted-foreground/30"
								)}
							/>
						)}
					</div>
				))}
			</div>
			<div className="text-center">
				<h2 className="text-lg font-semibold">{steps[currentStep]}</h2>
				<p className="text-sm text-muted-foreground mt-1">
					Step {currentStep + 1} of {totalSteps}
				</p>
			</div>
		</div>
	);
}
