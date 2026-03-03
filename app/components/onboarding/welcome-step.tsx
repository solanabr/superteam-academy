"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { isValidUsername, getUsernameSuggestions } from "@/lib/username-utils";
import { useAuth } from "@/contexts/auth-context";
import { useUsernameValidation } from "@/hooks/use-username-validation";

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
	const t = useTranslations("onboarding.welcome");
	const { user } = useAuth();
	const [username, setUsername] = useState(data.username || "");
	const { checking, available, debouncedCheck } = useUsernameValidation();
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [loadingSuggestions, setLoadingSuggestions] = useState(false);

	const handleUsernameChange = async (value: string) => {
		setUsername(value);
		debouncedCheck(value);
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
				<h1 className="text-2xl font-bold">{t("title")}</h1>
				<p className="text-muted-foreground mt-2">{t("description")}</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{t("usernameCard.title")}</CardTitle>
					<CardDescription>{t("usernameCard.description")}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="username">{t("usernameCard.label")}</Label>
						<div className="relative">
							<Input
								id="username"
								value={username}
								onChange={(e) => handleUsernameChange(e.target.value)}
								placeholder={t("usernameCard.placeholder")}
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
							{t("usernameCard.help")}
							{available === false && ` ${t("usernameCard.taken")}`}
							{available === true && ` ${t("usernameCard.available")}`}
						</p>
					</div>

					{!username && (
						<div className="space-y-2">
							{loadingSuggestions ? (
								<p className="text-xs text-muted-foreground">
									{t("suggestions.loading")}
								</p>
							) : null}
							{suggestions.length > 0 && (
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">
										{t("suggestions.title")}
									</p>
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
					{t("actions.continue")}
				</Button>
			</div>
		</div>
	);
}
