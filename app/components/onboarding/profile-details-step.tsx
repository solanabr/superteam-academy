"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface ProfileDetailsStepProps {
	data: OnboardingData;
	onNext: (data?: Partial<OnboardingData>) => void;
	onBack?: () => void;
	onComplete?: () => void;
}

const maxBioLength = 500;

export function ProfileDetailsStep({ data, onNext, onBack }: ProfileDetailsStepProps) {
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
				<h1 className="text-2xl font-bold">Profile details</h1>
				<p className="text-muted-foreground mt-2">
					Add optional details so others can find and connect with you.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Public Details</CardTitle>
					<CardDescription>These help your profile stand out.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="location">Location</Label>
							<Input
								id="location"
								value={profile.location}
								onChange={(event) =>
									setProfile((prev) => ({
										...prev,
										location: event.target.value,
									}))
								}
								placeholder="City, Country"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="website">Website/Portfolio</Label>
							<Input
								id="website"
								value={profile.website}
								onChange={(event) =>
									setProfile((prev) => ({ ...prev, website: event.target.value }))
								}
								placeholder="https://your-website.com"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="bio">Bio</Label>
						<Textarea
							id="bio"
							value={profile.bio}
							onChange={(event) =>
								setProfile((prev) => ({ ...prev, bio: event.target.value }))
							}
							placeholder="Tell us about your interests and what you're building..."
							rows={3}
						/>
						<p className="text-xs text-muted-foreground">
							{Math.max(0, maxBioLength - profile.bio.length)} characters remaining
						</p>
					</div>
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
