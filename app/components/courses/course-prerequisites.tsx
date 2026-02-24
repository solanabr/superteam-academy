"use client";

import { CheckCircle, AlertCircle, BookOpen, ExternalLink } from "lucide-react";
import { Link } from "@superteam-academy/i18n/navigation";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CoursePrerequisitesProps {
	prerequisites: Array<{
		id: string;
		title: string;
		completed: boolean;
	}>;
}

export function CoursePrerequisites({ prerequisites }: CoursePrerequisitesProps) {
	const t = useTranslations("courses");
	const completedCount = prerequisites.filter((p) => p.completed).length;
	const totalCount = prerequisites.length;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<BookOpen className="h-5 w-5" />
					{t("prerequisites.title")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">
						{t("prerequisites.completedOf", {
							completed: completedCount,
							total: totalCount,
						})}
					</span>
					<Badge variant={completedCount === totalCount ? "default" : "secondary"}>
						{completedCount === totalCount
							? t("prerequisites.ready")
							: t("prerequisites.inProgress")}
					</Badge>
				</div>

				<div className="space-y-3">
					{prerequisites.map((prerequisite) => (
						<div
							key={prerequisite.id}
							className="flex items-center gap-3 p-3 border rounded-lg"
						>
							{prerequisite.completed ? (
								<CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
							) : (
								<AlertCircle className="h-5 w-5 text-yellow-500 shrink-0" />
							)}

							<div className="flex-1">
								<div
									className={`font-medium ${prerequisite.completed ? "text-muted-foreground line-through" : ""}`}
								>
									{prerequisite.title}
								</div>
								<div className="text-sm text-muted-foreground">
									{prerequisite.completed
										? t("prerequisites.completed")
										: t("prerequisites.notCompleted")}
								</div>
							</div>

							<Button variant="outline" size="sm" asChild={true}>
								<Link href={`/courses/${prerequisite.id}`}>
									<ExternalLink className="h-4 w-4 mr-1" />
									{t("instructor.viewCourse")}
								</Link>
							</Button>
						</div>
					))}
				</div>

				{completedCount < totalCount && (
					<div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
						<div className="flex items-start gap-3">
							<AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
							<div>
								<h4 className="font-medium text-yellow-800 dark:text-yellow-200">
									{t("prerequisites.notMetTitle")}
								</h4>
								<p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
									{t("prerequisites.notMetDescription")}
								</p>
							</div>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
