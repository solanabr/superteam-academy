"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

interface GoalsStepProps {
	data: OnboardingData;
	onNext: (data?: Partial<OnboardingData>) => void;
	onBack?: () => void;
	onComplete?: () => void;
}

const LEARNING_GOALS = [
	"career-change",
	"skill-up",
	"certification",
	"personal-growth",
	"entrepreneurship",
	"freelancing",
	"job-promotion",
	"side-project",
	"teaching",
	"community-building",
];

export function GoalsStep({ data, onNext, onBack }: GoalsStepProps) {
	const t = useTranslations("onboarding.goals");
	const [selectedGoals, setSelectedGoals] = useState<string[]>(data.learningGoals || []);

	const toggleGoal = (goal: string) => {
		setSelectedGoals((prev) =>
			prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
		);
	};

	const handleNext = () => {
		onNext({
			learningGoals: selectedGoals,
		});
	};

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h1 className="text-2xl font-bold">{t("title")}</h1>
				<p className="text-muted-foreground mt-2">{t("description")}</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{t("card.title")}</CardTitle>
					<CardDescription>{t("card.description")}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
						{LEARNING_GOALS.map((goal) => (
							<button
								key={goal}
								type="button"
								className={`p-3 border rounded-lg cursor-pointer transition-colors text-left ${
									selectedGoals.includes(goal)
										? "border-primary bg-primary/5"
										: "border-border hover:border-primary/50"
								}`}
								onClick={() => toggleGoal(goal)}
							>
								<div className="font-medium">{t(`options.${goal}`)}</div>
							</button>
						))}
					</div>
					<p className="text-xs text-muted-foreground mt-2">
						{t("selected", { count: selectedGoals.length })}
					</p>
				</CardContent>
			</Card>

			<div className="flex justify-between">
				<Button variant="outline" onClick={onBack}>
					{t("actions.back")}
				</Button>
				<Button onClick={handleNext}>{t("actions.continue")}</Button>
			</div>
		</div>
	);
}
