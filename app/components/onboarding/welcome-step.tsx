"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { isValidUsername, isUsernameAvailable, getUsernameSuggestions } from "@/lib/username-utils";
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

interface WelcomeStepProps {
	data: OnboardingData;
	onNext: (data?: Partial<OnboardingData>) => void;
	onBack?: () => void;
	onComplete?: () => void;
}

export function WelcomeStep({ data, onNext }: WelcomeStepProps) {
	const { user } = useAuth();
	const [username, setUsername] = useState(data.username || "");
	const [checking, setChecking] = useState(false);
	const [available, setAvailable] = useState<boolean | null>(null);
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [loadingSuggestions, setLoadingSuggestions] = useState(false);

	const checkUsername = async (value: string) => {
		if (!(await isValidUsername(value))) {
			setAvailable(null);
			return;
		}

		setChecking(true);
		try {
			const result = await isUsernameAvailable(value);
			setAvailable(result);
		} catch {
			setAvailable(null);
		} finally {
			setChecking(false);
		}
	};

	const handleUsernameChange = async (value: string) => {
		setUsername(value);
		setAvailable(null);

		if (value && (await isValidUsername(value))) {
			const timeoutId = setTimeout(() => checkUsername(value), 500);
			setTimeout(() => clearTimeout(timeoutId), 600);
		}
	};

	useEffect(() => {
		if (!user || username) return;

		let active = true;
		const loadSuggestions = async () => {
			setLoadingSuggestions(true);
			try {
				const suggested = await getUsernameSuggestions({
					name: user.name,
					email: user.email,
				});
				if (active) {
					setSuggestions(suggested.slice(0, 3));
				}
			} finally {
				if (active) {
					setLoadingSuggestions(false);
				}
			}
		};

		void loadSuggestions();

		return () => {
			active = false;
		};
	}, [user, username]);

	const handleNext = async () => {
		if (!username || !(await isValidUsername(username)) || available !== true) {
			return;
		}
		onNext({ username });
	};

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h1 className="text-2xl font-bold">Welcome to Superteam Academy! 🎉</h1>
				<p className="text-muted-foreground mt-2">
					Let's set up your profile to get the most out of your learning journey.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Choose Your Username</CardTitle>
					<CardDescription>
						This will be your unique identifier on the platform. Choose something
						memorable!
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="username">Username</Label>
						<div className="relative">
							<Input
								id="username"
								value={username}
								onChange={(e) => handleUsernameChange(e.target.value)}
								placeholder="your-username"
								className={
									username && available === false ? "border-destructive" : ""
								}
							/>
							{username && (
								<div className="absolute right-3 top-1/2 -translate-y-1/2">
									{checking ? (
										<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
									) : available === true ? (
										<Check className="h-4 w-4 text-green-500" />
									) : available === false ? (
										<X className="h-4 w-4 text-destructive" />
									) : null}
								</div>
							)}
						</div>
						<p className="text-xs text-muted-foreground">
							3-30 characters. Letters, numbers, hyphens, and underscores only.
							{available === false && " This username is already taken."}
							{available === true && " Username is available!"}
						</p>
					</div>

					{!username && (
						<div className="space-y-2">
							{loadingSuggestions ? (
								<p className="text-xs text-muted-foreground">
									Loading suggestions...
								</p>
							) : null}
							{suggestions.length > 0 && (
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">Suggestions:</p>
									<div className="flex flex-wrap gap-1">
										{suggestions.map((suggestion) => (
											<Button
												key={suggestion}
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => handleUsernameChange(suggestion)}
												className="h-7 px-2 text-xs"
											>
												{suggestion}
											</Button>
										))}
									</div>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			<div className="flex justify-end">
				<Button onClick={handleNext} disabled={!username || available !== true}>
					Continue
				</Button>
			</div>
		</div>
	);
}
