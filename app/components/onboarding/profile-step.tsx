"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
	const { user } = useAuth();
	const [profile, setProfile] = useState({
		name: data.name || user?.name || "",
		bio: data.bio || "",
		location: data.location || "",
		website: data.website || "",
		title: data.title || "",
		company: data.company || "",
	});

	const handleNext = () => {
		onNext(profile);
	};

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h1 className="text-2xl font-bold">Tell us about yourself</h1>
				<p className="text-muted-foreground mt-2">
					Help others get to know you better on the platform.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Basic Information</CardTitle>
					<CardDescription>
						Share some details about yourself and your background.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="name">Full Name</Label>
							<Input
								id="name"
								value={profile.name}
								onChange={(e) =>
									setProfile((prev) => ({ ...prev, name: e.target.value }))
								}
								placeholder="Your full name"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="title">Professional Title</Label>
							<Input
								id="title"
								value={profile.title}
								onChange={(e) =>
									setProfile((prev) => ({ ...prev, title: e.target.value }))
								}
								placeholder="Software Engineer, Student, etc."
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="company">Company/Organization</Label>
						<Input
							id="company"
							value={profile.company}
							onChange={(e) =>
								setProfile((prev) => ({ ...prev, company: e.target.value }))
							}
							placeholder="Where do you work or study?"
						/>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="location">Location</Label>
							<Input
								id="location"
								value={profile.location}
								onChange={(e) =>
									setProfile((prev) => ({ ...prev, location: e.target.value }))
								}
								placeholder="City, Country"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="website">Website/Portfolio</Label>
							<Input
								id="website"
								value={profile.website}
								onChange={(e) =>
									setProfile((prev) => ({ ...prev, website: e.target.value }))
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
							onChange={(e) =>
								setProfile((prev) => ({ ...prev, bio: e.target.value }))
							}
							placeholder="Tell us about yourself, your interests, and what you're hoping to achieve..."
							rows={3}
						/>
						<p className="text-xs text-muted-foreground">
							{maxBioLength - profile.bio.length} characters remaining
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

const maxBioLength = 500;
