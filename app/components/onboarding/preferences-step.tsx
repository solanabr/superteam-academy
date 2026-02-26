"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

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
	const t = useTranslations("onboarding.preferences");
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
				<h1 className="text-2xl font-bold">{t("title")}</h1>
				<p className="text-muted-foreground mt-2">{t("description")}</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{t("card.title")}</CardTitle>
					<CardDescription>{t("card.description")}</CardDescription>
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
								{t(`topics.${topic}`)}
							</Badge>
						))}
					</div>
					<p className="text-xs text-muted-foreground mt-2">
						{t("selected", { count: selectedTopics.length })}
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
