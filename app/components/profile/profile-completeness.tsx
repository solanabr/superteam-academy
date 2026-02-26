"use client";

import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Circle } from "lucide-react";

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
	const completenessItems = useMemo(
		() => [
			{ key: "name", label: "Name", completed: !!user.name },
			{ key: "username", label: "Username", completed: !!user.username },
			{ key: "bio", label: "Bio", completed: !!user.bio },
			{ key: "title", label: "Professional Title", completed: !!user.title },
			{ key: "location", label: "Location", completed: !!user.location },
			{ key: "experience", label: "Experience Level", completed: !!user.experienceLevel },
			{
				key: "goals",
				label: "Learning Goals",
				completed: user.learningGoals && user.learningGoals.length > 0,
			},
			{ key: "skills", label: "Skills", completed: user.skills && user.skills.length > 0 },
			{ key: "github", label: "GitHub", completed: !!user.github },
			{ key: "linkedin", label: "LinkedIn", completed: !!user.linkedin },
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
		if (percentage >= 80) return "Excellent";
		if (percentage >= 60) return "Good";
		if (percentage >= 40) return "Fair";
		return "Needs Work";
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>Profile Completeness</span>
					<Badge variant="outline" className={getCompletenessColor(completeness)}>
						{getCompletenessLabel(completeness)}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span>{completeness}% Complete</span>
						<span>
							{completenessItems.filter((item) => item.completed).length}/
							{completenessItems.length}
						</span>
					</div>
					<Progress value={completeness} className="h-2" />
				</div>

				<div className="space-y-2">
					<h4 className="text-sm font-medium">Missing Information:</h4>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
						{completenessItems
							.filter((item) => !item.completed)
							.map((item) => (
								<div
									key={item.key}
									className="flex items-center gap-2 text-sm text-muted-foreground"
								>
									<Circle className="h-3 w-3" />
									<span>{item.label}</span>
								</div>
							))}
					</div>
				</div>

				{completeness < 100 && (
					<div className="pt-2 border-t">
						<p className="text-xs text-muted-foreground">
							Complete your profile to unlock personalized recommendations and connect
							with other learners.
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
