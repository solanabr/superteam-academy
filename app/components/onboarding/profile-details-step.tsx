"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

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

interface ProfileDetailsStepProps {
	data: OnboardingData;
	onNext: (data?: Partial<OnboardingData>) => void;
	onBack?: () => void;
	onComplete?: () => void;
}

const maxBioLength = 500;

export function ProfileDetailsStep({ data, onNext, onBack }: ProfileDetailsStepProps) {
	const t = useTranslations("onboarding.profileDetails");
	const [profile, setProfile] = useState({
		bio: data.bio || "",
		location: data.location || "",
		website: data.website || "",
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
							<Label htmlFor="location">{t("fields.location.label")}</Label>
							<Input
								id="location"
								value={profile.location}
								onChange={(event) =>
									setProfile((prev) => ({
										...prev,
										location: event.target.value,
									}))
								}
								placeholder={t("fields.location.placeholder")}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="website">{t("fields.website.label")}</Label>
							<Input
								id="website"
								value={profile.website}
								onChange={(event) =>
									setProfile((prev) => ({ ...prev, website: event.target.value }))
								}
								placeholder={t("fields.website.placeholder")}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="bio">{t("fields.bio.label")}</Label>
						<Textarea
							id="bio"
							value={profile.bio}
							onChange={(event) =>
								setProfile((prev) => ({ ...prev, bio: event.target.value }))
							}
							placeholder={t("fields.bio.placeholder")}
							rows={3}
						/>
						<p className="text-xs text-muted-foreground">
							{t("fields.bio.remaining", {
								count: Math.max(0, maxBioLength - profile.bio.length),
							})}
						</p>
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
