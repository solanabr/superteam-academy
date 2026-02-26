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
	timeCommitment?: string;
}

interface ExperienceStepProps {
	data: OnboardingData;
	onNext: (data?: Partial<OnboardingData>) => void;
	onBack?: () => void;
	onComplete?: () => void;
}

const EXPERIENCE_LEVELS = [
	{ value: "beginner" },
	{ value: "intermediate" },
	{ value: "advanced" },
	{ value: "expert" },
];

export function ExperienceStep({ data, onNext, onBack }: ExperienceStepProps) {
	const t = useTranslations("onboarding.experience");
	const [experienceLevel, setExperienceLevel] = useState(data.experienceLevel || "");

	const handleNext = () => {
		onNext({ experienceLevel });
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
				<CardContent className="space-y-3">
					{EXPERIENCE_LEVELS.map((level) => (
						<button
							key={level.value}
							type="button"
							className={`p-3 border rounded-lg cursor-pointer transition-colors text-left w-full ${
								experienceLevel === level.value
									? "border-primary bg-primary/5"
									: "border-border hover:border-primary/50"
							}`}
							onClick={() => setExperienceLevel(level.value)}
						>
							<div className="font-medium">{t(`levels.${level.value}.label`)}</div>
							<div className="text-sm text-muted-foreground">
								{t(`levels.${level.value}.description`)}
							</div>
						</button>
					))}
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
