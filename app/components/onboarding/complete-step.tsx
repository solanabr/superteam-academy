"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Rocket } from "lucide-react";

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

interface CompleteStepProps {
	data: OnboardingData;
	onNext: (data?: Partial<OnboardingData>) => void;
	onBack?: () => void;
	onComplete?: () => void;
}

export function CompleteStep({ onComplete }: CompleteStepProps) {
	return (
		<div className="space-y-6">
			<div className="text-center">
				<div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
					<CheckCircle className="w-8 h-8 text-green-600" />
				</div>
				<h1 className="text-2xl font-bold">You're all set! 🎉</h1>
				<p className="text-muted-foreground mt-2">
					Your profile is ready and your learning journey begins now.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>What's Next?</CardTitle>
					<CardDescription>Here's what you can do to get started:</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-3">
						<div className="flex items-start gap-3">
							<div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
								<span className="text-xs font-medium text-primary">1</span>
							</div>
							<div>
								<h4 className="font-medium">Explore Courses</h4>
								<p className="text-sm text-muted-foreground">
									Browse our curated collection of blockchain and web development
									courses.
								</p>
							</div>
						</div>

						<div className="flex items-start gap-3">
							<div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
								<span className="text-xs font-medium text-primary">2</span>
							</div>
							<div>
								<h4 className="font-medium">Start Learning</h4>
								<p className="text-sm text-muted-foreground">
									Enroll in your first course and begin earning XP and
									achievements.
								</p>
							</div>
						</div>

						<div className="flex items-start gap-3">
							<div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
								<span className="text-xs font-medium text-primary">3</span>
							</div>
							<div>
								<h4 className="font-medium">Connect & Share</h4>
								<p className="text-sm text-muted-foreground">
									Join our community, share your progress, and learn with others.
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="bg-linear-to-r from-primary/10 to-primary/5 rounded-lg p-4">
				<div className="flex items-center gap-3">
					<Rocket className="w-5 h-5 text-primary" />
					<div>
						<h4 className="font-medium">Ready to launch your learning journey?</h4>
						<p className="text-sm text-muted-foreground">
							Your personalized dashboard awaits!
						</p>
					</div>
				</div>
			</div>

			<div className="flex justify-center">
				<Button onClick={onComplete} size="lg" className="px-8">
					<Rocket className="w-4 h-4 mr-2" />
					Get Started
				</Button>
			</div>
		</div>
	);
}
