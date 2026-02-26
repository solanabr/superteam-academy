"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface OnboardingData {
	timeCommitment?: string;
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

interface TimeCommitmentStepProps {
	data: OnboardingData;
	onNext: (data?: Partial<OnboardingData>) => void;
	onBack?: () => void;
	onComplete?: () => void;
}

const TIME_COMMITMENTS = [
	{ value: "casual", label: "Casual (1-2 hours/week)", description: "Light learning pace" },
	{ value: "regular", label: "Regular (3-5 hours/week)", description: "Moderate commitment" },
	{ value: "intensive", label: "Intensive (6+ hours/week)", description: "High commitment" },
];

export function TimeCommitmentStep({ data, onNext, onBack }: TimeCommitmentStepProps) {
	const [timeCommitment, setTimeCommitment] = useState(data.timeCommitment || "");

	const handleNext = () => {
		onNext({ timeCommitment });
	};

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h1 className="text-2xl font-bold">Your weekly commitment</h1>
				<p className="text-muted-foreground mt-2">
					How much time can you regularly dedicate to learning?
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Time Commitment</CardTitle>
					<CardDescription>Choose one option.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{TIME_COMMITMENTS.map((commitment) => (
						<button
							key={commitment.value}
							type="button"
							className={`p-3 border rounded-lg cursor-pointer transition-colors text-left w-full ${
								timeCommitment === commitment.value
									? "border-primary bg-primary/5"
									: "border-border hover:border-primary/50"
							}`}
							onClick={() => setTimeCommitment(commitment.value)}
						>
							<div className="font-medium">{commitment.label}</div>
							<div className="text-sm text-muted-foreground">
								{commitment.description}
							</div>
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
