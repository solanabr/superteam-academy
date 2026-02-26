"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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

const TIME_COMMITMENTS = [{ value: "casual" }, { value: "regular" }, { value: "intensive" }];

export function TimeCommitmentStep({ data, onNext, onBack }: TimeCommitmentStepProps) {
	const t = useTranslations("onboarding.timeCommitment");
	const [timeCommitment, setTimeCommitment] = useState(data.timeCommitment || "");

	const handleNext = () => {
		onNext({ timeCommitment });
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
							<div className="font-medium">
								{t(`options.${commitment.value}.label`)}
							</div>
							<div className="text-sm text-muted-foreground">
								{t(`options.${commitment.value}.description`)}
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
