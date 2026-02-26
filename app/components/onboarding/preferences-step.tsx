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

export function PreferencesStep({ data, onNext, onBack }: PreferencesStepProps) {
	const [selectedTopics, setSelectedTopics] = useState<string[]>(data.preferredTopics || []);

	const toggleTopic = (topic: string) => {
		setSelectedTopics((prev) =>
			prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
		);
	};

	const handleNext = () => {
		onNext({
			preferredTopics: selectedTopics,
		});
	};

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h1 className="text-2xl font-bold">Topics you care about</h1>
				<p className="text-muted-foreground mt-2">
					Pick the areas you want to explore first.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Topics of Interest</CardTitle>
					<CardDescription>Select all that apply.</CardDescription>
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

			<div className="flex justify-between">
				<Button variant="outline" onClick={onBack}>
					Back
				</Button>
				<Button onClick={handleNext}>Continue</Button>
			</div>
		</div>
	);
}
