"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/auth-context";

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

interface ProfileStepProps {
	data: OnboardingData;
	onNext: (data?: Partial<OnboardingData>) => void;
	onBack?: () => void;
	onComplete?: () => void;
}

export function ProfileStep({ data, onNext, onBack }: ProfileStepProps) {
	const t = useTranslations("onboarding.profile");
	const { user } = useAuth();
	const [profile, setProfile] = useState({
		name: data.name || user?.name || "",
		title: data.title || "",
		company: data.company || "",
	});

	const handleNext = () => {
		onNext(profile);
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
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="name">{t("fields.name.label")}</Label>
							<Input
								id="name"
								value={profile.name}
								onChange={(e) =>
									setProfile((prev) => ({ ...prev, name: e.target.value }))
								}
								placeholder={t("fields.name.placeholder")}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="title">{t("fields.title.label")}</Label>
							<Input
								id="title"
								value={profile.title}
								onChange={(e) =>
									setProfile((prev) => ({ ...prev, title: e.target.value }))
								}
								placeholder={t("fields.title.placeholder")}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="company">{t("fields.company.label")}</Label>
						<Input
							id="company"
							value={profile.company}
							onChange={(e) =>
								setProfile((prev) => ({ ...prev, company: e.target.value }))
							}
							placeholder={t("fields.company.placeholder")}
						/>
					</div>
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
