"use client";

import { useState } from "react";
import { CheckCircle, ArrowRight, BookOpen, Users, Trophy, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

interface OnboardingStep {
	id: string;
	title: string;
	description: string;
	icon: React.ReactNode;
	action?: string;
	completed: boolean;
}

interface OnboardingFlowProps {
	onComplete?: () => void;
	onSkip?: () => void;
}

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
	const t = useTranslations("onboarding");
	const { toast } = useToast();
	const [currentStep, setCurrentStep] = useState(0);
	const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

	const steps: OnboardingStep[] = [
		{
			id: "welcome",
			title: t("welcomeTitle"),
			description: t("welcomeDesc"),
			icon: <BookOpen className="h-8 w-8" />,
			completed: false,
		},
		{
			id: "connect-wallet",
			title: t("connectWalletTitle"),
			description: t("connectWalletDesc"),
			icon: <Users className="h-8 w-8" />,
			action: t("connectWallet"),
			completed: false,
		},
		{
			id: "explore-courses",
			title: t("exploreCoursesTitle"),
			description: t("exploreCoursesDesc"),
			icon: <Target className="h-8 w-8" />,
			action: t("exploreCourses"),
			completed: false,
		},
		{
			id: "first-challenge",
			title: t("firstChallengeTitle"),
			description: t("firstChallengeDesc"),
			icon: <Trophy className="h-8 w-8" />,
			action: t("startChallenge"),
			completed: false,
		},
		{
			id: "complete",
			title: t("setupCompleteTitle"),
			description: t("setupCompleteDesc"),
			icon: <CheckCircle className="h-8 w-8" />,
			completed: false,
		},
	];

	const handleStepComplete = (stepId: string) => {
		setCompletedSteps((prev) => new Set([...prev, stepId]));
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		}
	};

	const handleNext = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			onComplete?.();
			toast({
				title: t("onboardingComplete"),
				description: t("onboardingCompleteDesc"),
			});
		}
	};

	const handlePrevious = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const progress = (completedSteps.size / (steps.length - 1)) * 100;

	return (
		<Card className="w-full max-w-2xl mx-auto">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<BookOpen className="h-6 w-6" />
						{t("gettingStarted")}
					</CardTitle>
					<Badge variant="secondary">
						{completedSteps.size}/{steps.length - 1} {t("completed")}
					</Badge>
				</div>
				<Progress value={progress} className="mt-2" />
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="flex items-center justify-center space-x-2">
					{steps.slice(0, -1).map((step, index) => (
						<div
							key={step.id}
							className={`w-3 h-3 rounded-full ${
								index < currentStep
									? "bg-green-500"
									: index === currentStep
										? "bg-blue-500"
										: "bg-gray-300"
							}`}
						/>
					))}
				</div>

				<div className="text-center space-y-4">
					<div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
						{steps[currentStep].icon}
					</div>
					<div className="space-y-2">
						<h3 className="text-xl font-semibold">{steps[currentStep].title}</h3>
						<p className="text-muted-foreground">{steps[currentStep].description}</p>
					</div>

					{steps[currentStep].action && (
						<Button
							onClick={() => handleStepComplete(steps[currentStep].id)}
							className="mt-4"
						>
							{steps[currentStep].action}
							<ArrowRight className="h-4 w-4 ml-2" />
						</Button>
					)}
				</div>

				<div className="space-y-3">
					{steps.slice(0, -1).map((step, index) => (
						<div
							key={step.id}
							className={`flex items-center gap-3 p-3 rounded-lg border ${
								completedSteps.has(step.id)
									? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
									: index === currentStep
										? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
										: "bg-muted"
							}`}
						>
							<div
								className={`p-1 rounded ${
									completedSteps.has(step.id)
										? "bg-green-500 text-white"
										: index === currentStep
											? "bg-blue-500 text-white"
											: "bg-gray-300"
								}`}
							>
								{completedSteps.has(step.id) ? (
									<CheckCircle className="h-4 w-4" />
								) : (
									<span className="text-xs font-medium">{index + 1}</span>
								)}
							</div>
							<div className="flex-1">
								<p className="font-medium">{step.title}</p>
								<p className="text-sm text-muted-foreground">{step.description}</p>
							</div>
						</div>
					))}
				</div>

				<div className="flex justify-between">
					<Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
						{t("previous")}
					</Button>
					<Button variant="outline" onClick={onSkip}>
						{t("skip")}
					</Button>
					<Button
						onClick={handleNext}
						disabled={
							!completedSteps.has(steps[currentStep].id) &&
							Boolean(steps[currentStep].action)
						}
					>
						{currentStep === steps.length - 1 ? t("finish") : t("next")}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
