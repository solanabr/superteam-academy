"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

interface PreferencesStepProps {
	data: OnboardingData;
	onNext: (data?: Partial<OnboardingData>) => void;
	onBack?: () => void;
	onComplete?: () => void;
}

const TOPICS = [
	"web-development",
	"blockchain",
	"smart-contracts",
	"defi",
	"nft",
	"cryptography",
	"data-science",
	"machine-learning",
	"mobile-development",
	"game-development",
	"devops",
	"security",
	"ai",
	"cloud-computing",
	"databases",
	"api-development",
];

const TIME_COMMITMENTS = [
	{ value: "casual", label: "Casual (1-2 hours/week)", description: "Light learning pace" },
	{ value: "regular", label: "Regular (3-5 hours/week)", description: "Moderate commitment" },
	{ value: "intensive", label: "Intensive (6+ hours/week)", description: "Full-time learning" },
];

export function PreferencesStep({ data, onNext, onBack }: PreferencesStepProps) {
	const [selectedTopics, setSelectedTopics] = useState<string[]>(data.preferredTopics || []);
	const [timeCommitment, setTimeCommitment] = useState(data.timeCommitment || "");

	const toggleTopic = (topic: string) => {
		setSelectedTopics((prev) =>
			prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
		);
	};

	const handleNext = () => {
		onNext({
			preferredTopics: selectedTopics,
			timeCommitment,
		});
	};

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h1 className="text-2xl font-bold">Your Learning Preferences</h1>
				<p className="text-muted-foreground mt-2">
					Help us personalize your learning experience.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Topics of Interest</CardTitle>
					<CardDescription>
						Select the topics you're most interested in learning about.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-2">
						{TOPICS.map((topic) => (
							<Badge
								key={topic}
								variant={selectedTopics.includes(topic) ? "default" : "outline"}
								className="cursor-pointer hover:bg-primary/80"
								onClick={() => toggleTopic(topic)}
							>
								{topic.replace("-", " ")}
							</Badge>
						))}
					</div>
					<p className="text-xs text-muted-foreground mt-2">
						Selected: {selectedTopics.length} topics
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Time Commitment</CardTitle>
					<CardDescription>
						How much time do you plan to dedicate to learning each week?
					</CardDescription>
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
