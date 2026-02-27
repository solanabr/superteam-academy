"use client";

import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Circle } from "lucide-react";
import { useTranslations } from "next-intl";

interface ProfileCompletenessProps {
	user: {
		name?: string;
		bio?: string;
		location?: string;
		title?: string;
		experienceLevel?: string;
		learningGoals?: string[];
		skills?: string[];
		github?: string;
		linkedin?: string;
		username?: string | undefined;
	};
}

export function ProfileCompleteness({ user }: ProfileCompletenessProps) {
	const t = useTranslations("profile.completeness");
	const completenessItems = useMemo(
		() => [
			{ key: "name", labelKey: "fields.name", completed: !!user.name },
			{ key: "username", labelKey: "fields.username", completed: !!user.username },
			{ key: "bio", labelKey: "fields.bio", completed: !!user.bio },
			{ key: "title", labelKey: "fields.professionalTitle", completed: !!user.title },
			{ key: "location", labelKey: "fields.location", completed: !!user.location },
			{
				key: "experience",
				labelKey: "fields.experienceLevel",
				completed: !!user.experienceLevel,
			},
			{
				key: "goals",
				labelKey: "fields.learningGoals",
				completed: user.learningGoals && user.learningGoals.length > 0,
			},
			{
				key: "skills",
				labelKey: "fields.skills",
				completed: user.skills && user.skills.length > 0,
			},
			{ key: "github", labelKey: "fields.github", completed: !!user.github },
			{ key: "linkedin", labelKey: "fields.linkedin", completed: !!user.linkedin },
		],
		[user]
	);

	const completeness = useMemo(() => {
		const filled = completenessItems.filter((item) => item.completed).length;
		return Math.round((filled / completenessItems.length) * 100);
	}, [completenessItems]);

	const getCompletenessColor = (percentage: number) => {
		if (percentage >= 80) return "text-green-600";
		if (percentage >= 60) return "text-yellow-600";
		return "text-red-600";
	};

	const getCompletenessLabel = (percentage: number) => {
		if (percentage >= 80) return t("status.excellent");
		if (percentage >= 60) return t("status.good");
		if (percentage >= 40) return t("status.fair");
		return t("status.needsWork");
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>{t("title")}</span>
					<Badge variant="outline" className={getCompletenessColor(completeness)}>
						{getCompletenessLabel(completeness)}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span>{t("percentComplete", { percent: completeness })}</span>
						<span>
							{completenessItems.filter((item) => item.completed).length}/
							{completenessItems.length}
						</span>
					</div>
					<Progress value={completeness} className="h-2" />
				</div>

				<div className="space-y-2">
					<h4 className="text-sm font-medium">{t("missingInformation")}</h4>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
						{completenessItems
							.filter((item) => !item.completed)
							.map((item) => (
								<div
									key={item.key}
									className="flex items-center gap-2 text-sm text-muted-foreground"
								>
									<Circle className="h-3 w-3" />
									<span>{t(item.labelKey)}</span>
								</div>
							))}
					</div>
				</div>

				{completeness < 100 && (
					<div className="pt-2 border-t">
						<p className="text-xs text-muted-foreground">
							{t("cta")}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
