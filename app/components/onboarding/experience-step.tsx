"use client";

import { useState } from "react";
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
	{ value: "beginner", label: "Beginner", description: "New to programming/development" },
	{
		value: "intermediate",
		label: "Intermediate",
		description: "Some experience, building projects",
	},
	{
		value: "advanced",
		label: "Advanced",
		description: "Experienced developer, complex projects",
	},
	{ value: "expert", label: "Expert", description: "Senior level, mentoring others" },
];

export function ExperienceStep({ data, onNext, onBack }: ExperienceStepProps) {
	const [experienceLevel, setExperienceLevel] = useState(data.experienceLevel || "");

	const handleNext = () => {
		onNext({ experienceLevel });
	};

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h1 className="text-2xl font-bold">Your current level</h1>
				<p className="text-muted-foreground mt-2">
					This helps us tailor recommendations from day one.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Experience Level</CardTitle>
					<CardDescription>Pick the closest match.</CardDescription>
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
							<div className="font-medium">{level.label}</div>
							<div className="text-sm text-muted-foreground">{level.description}</div>
						</button>
					))}
				</CardContent>
			</Card>

			<div className="flex justify-between">
				<Button variant="outline" onClick={onBack}>
					Back
				</Button>
				<Button onClick={handleNext}>Continue</Button>
			</div>
		</div>
	);
}
