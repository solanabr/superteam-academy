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

export function GoalsStep({ data, onNext, onBack }: GoalsStepProps) {
	const [selectedGoals, setSelectedGoals] = useState<string[]>(data.learningGoals || []);
	const [experienceLevel, setExperienceLevel] = useState(data.experienceLevel || "");

	const toggleGoal = (goal: string) => {
		setSelectedGoals((prev) =>
			prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
		);
	};

	const handleNext = () => {
		onNext({
			learningGoals: selectedGoals,
			experienceLevel,
		});
	};

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h1 className="text-2xl font-bold">Your Learning Goals</h1>
				<p className="text-muted-foreground mt-2">
					What do you hope to achieve through learning on Superteam Academy?
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Experience Level</CardTitle>
					<CardDescription>
						Where would you place yourself on the learning journey?
					</CardDescription>
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

			<Card>
				<CardHeader>
					<CardTitle>Learning Goals</CardTitle>
					<CardDescription>
						What are your main objectives? Select all that apply.
					</CardDescription>
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
								<div className="font-medium capitalize">
									{goal.replace("-", " ")}
								</div>
							</button>
						))}
					</div>
					<p className="text-xs text-muted-foreground mt-2">
						Selected: {selectedGoals.length} goals
					</p>
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
