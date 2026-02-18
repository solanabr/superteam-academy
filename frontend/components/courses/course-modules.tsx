import { ChevronDown, Play, FileText, Code, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface CourseModulesProps {
	modules: Array<{
		id: string;
		title: string;
		description: string;
		duration: string;
		lessons: number;
		completed: boolean;
		lessonsList: Array<{
			id: string;
			title: string;
			duration: string;
			type: "video" | "interactive" | "quiz" | "reading";
			completed: boolean;
		}>;
	}>;
}

export function CourseModules({ modules }: CourseModulesProps) {
	const t = useTranslations("courses");

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">{t("modules.title")}</h2>
				<div className="text-sm text-muted-foreground">
					{t("modules.modulesCount", { count: modules.length })} •{" "}
					{t("modules.lessonsCount", { count: modules.reduce((acc, module) => acc + module.lessons, 0) })}
				</div>
			</div>

			<div className="space-y-3">
				{modules.map((module, moduleIndex) => (
					<ModuleCard key={module.id} module={module} moduleNumber={moduleIndex + 1} />
				))}
			</div>
		</div>
	);
}

function ModuleCard({
	module,
	moduleNumber,
}: {
	module: CourseModulesProps["modules"][0];
	moduleNumber: number;
}) {
	const t = useTranslations("courses");
	const getLessonIcon = (type: string) => {
		switch (type) {
			case "video":
				return <Play className="h-4 w-4" />;
			case "interactive":
				return <Code className="h-4 w-4" />;
			case "quiz":
				return <FileText className="h-4 w-4" />;
			case "reading":
				return <FileText className="h-4 w-4" />;
			default:
				return <FileText className="h-4 w-4" />;
		}
	};

	const completedLessons = module.lessonsList.filter((lesson) => lesson.completed).length;
	const progressPercentage = (completedLessons / module.lessons) * 100;

	return (
		<Card>
			<Collapsible>
				<CollapsibleTrigger asChild={true}>
					<CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<div className="flex items-center gap-2">
									<Badge
										variant="outline"
										className="w-8 h-8 rounded-full p-0 flex items-center justify-center"
									>
										{moduleNumber}
									</Badge>
									<div>
										<CardTitle className="text-lg">{module.title}</CardTitle>
										<p className="text-sm text-muted-foreground mt-1">
											{module.description}
										</p>
									</div>
								</div>
							</div>

							<div className="flex items-center gap-4">
								<div className="text-right text-sm text-muted-foreground">
									<div>{t("modules.lessonsCount", { count: module.lessons })}</div>
									<div>{module.duration}</div>
								</div>
								<div className="flex items-center gap-2">
									{module.completed && (
										<CheckCircle className="h-5 w-5 text-green-500" />
									)}
									<ChevronDown className="h-5 w-5" />
								</div>
							</div>
						</div>

						<div className="mt-4">
							<div className="flex items-center justify-between text-sm mb-2">
								<span className="text-muted-foreground">
									{t("modules.lessonsCompleted", { completed: completedLessons, total: module.lessons })}
								</span>
								<span className="font-medium">
									{Math.round(progressPercentage)}%
								</span>
							</div>
							<div className="w-full bg-secondary rounded-full h-2">
								<div
									className="bg-primary h-2 rounded-full transition-all duration-300"
									style={{ width: `${progressPercentage}%` }}
								/>
							</div>
						</div>
					</CardHeader>
				</CollapsibleTrigger>

				<CollapsibleContent>
					<CardContent className="pt-0">
						<div className="space-y-2">
							{module.lessonsList.map((lesson, _lessonIndex) => (
								<div
									key={lesson.id}
									className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
								>
									<div className="flex items-center gap-3">
										<div className="flex items-center gap-2">
											{lesson.completed ? (
												<CheckCircle className="h-5 w-5 text-green-500" />
											) : (
												<div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
											)}
											<div className="text-muted-foreground">
												{getLessonIcon(lesson.type)}
											</div>
										</div>

										<div>
											<div className="font-medium">{lesson.title}</div>
											<div className="text-sm text-muted-foreground">
												{lesson.type.charAt(0).toUpperCase() +
													lesson.type.slice(1)}{" "}
												• {lesson.duration}
											</div>
										</div>
									</div>

									<div className="flex items-center gap-2">
										<Badge variant="outline" className="text-xs">
											{lesson.type}
										</Badge>
										{lesson.completed ? (
											<Button size="sm" variant="ghost" disabled={true}>
												{t("modules.completed")}
											</Button>
										) : (
											<Button size="sm" variant="ghost">
												{t("modules.start")}
											</Button>
										)}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}
