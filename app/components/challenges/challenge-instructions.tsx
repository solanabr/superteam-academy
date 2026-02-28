"use client";

import { CheckCircle, Circle, Target, Clock, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from "next-intl";

interface Challenge {
	id: string;
	title: string;
	description: string;
	difficulty: string;
	estimatedTime: string;
	xpReward: number;
	instructions: Array<{
		title: string;
		content: string;
	}>;
	objectives: string[];
}

interface ChallengeInstructionsProps {
	challenge: Challenge;
	progress?: {
		completedObjectives: number[];
	};
}

export function ChallengeInstructions({
	challenge,
	progress = { completedObjectives: [] },
}: ChallengeInstructionsProps) {
	const t = useTranslations("challenges");

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Target className="h-5 w-5" />
						{challenge.title}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-muted-foreground">{challenge.description}</p>

					<div className="flex flex-wrap gap-2">
						<Badge variant="outline" className="gap-1">
							<Target className="h-3 w-3" />
							{challenge.difficulty}
						</Badge>
						<Badge variant="outline" className="gap-1">
							<Clock className="h-3 w-3" />
							{challenge.estimatedTime}
						</Badge>
						<Badge variant="outline" className="gap-1">
							<Award className="h-3 w-3" />
							{challenge.xpReward} XP
						</Badge>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("instructions.objectives")}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{challenge.objectives.map((objective, index) => {
							const isCompleted = progress.completedObjectives.includes(index);
							return (
								<div key={index} className="flex items-start gap-3">
									{isCompleted ? (
										<CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
									) : (
										<Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
									)}
									<div
										className={`flex-1 ${isCompleted ? "line-through text-muted-foreground" : ""}`}
									>
										<p className="text-sm">{objective}</p>
									</div>
								</div>
							);
						})}
					</div>

					<div className="mt-4">
						<div className="flex justify-between text-sm mb-2">
							<span>{t("instructions.progress")}</span>
							<span>
								{progress.completedObjectives.length} /{" "}
								{challenge.objectives.length}
							</span>
						</div>
						<Progress
							value={
								(progress.completedObjectives.length /
									challenge.objectives.length) *
								100
							}
							className="h-2"
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("instructions.steps")}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						{challenge.instructions.map((instruction, index) => (
							<div key={index} className="space-y-2">
								<div className="flex items-center gap-3">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
										{index + 1}
									</div>
									<h3 className="font-medium">{instruction.title}</h3>
								</div>
								<div className="ml-11">
									<p className="text-sm text-muted-foreground leading-relaxed">
										{instruction.content}
									</p>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("instructions.tips.title")}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3 text-sm text-muted-foreground">
						<p>• {t("instructions.tips.readCarefully")}</p>
						<p>• {t("instructions.tips.testFrequently")}</p>
						<p>• {t("instructions.tips.useHints")}</p>
						<p>• {t("instructions.tips.askHelp")}</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
