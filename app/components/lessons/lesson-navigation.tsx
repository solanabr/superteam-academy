"use client";

import { ChevronLeft, ChevronRight, CheckCircle, Circle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslations } from "next-intl";
import { formatDuration } from "@/lib/utils";

interface Lesson {
	id: string;
	title: string;
	completed: boolean;
	duration: number;
}

interface LessonNavigationProps {
	currentLessonId: string;
	lessons: Lesson[];
	onLessonSelect: (lessonId: string) => void;
	onPrevious?: () => void;
	onNext?: () => void;
	hasPrevious: boolean;
	hasNext: boolean;
}

export function LessonNavigation({
	currentLessonId,
	lessons,
	onLessonSelect,
	onPrevious,
	onNext,
	hasPrevious,
	hasNext,
}: LessonNavigationProps) {
	const t = useTranslations("lessonNavigation");

	return (
		<div className="space-y-2">
			<div className="flex gap-1.5">
				<Button
					variant="outline"
					size="sm"
					onClick={onPrevious}
					disabled={!hasPrevious}
					className="flex-1 h-7 text-xs"
				>
					<ChevronLeft className="h-3 w-3 mr-1" />
					{t("previousLesson")}
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={onNext}
					disabled={!hasNext}
					className="flex-1 h-7 text-xs"
				>
					{t("nextLesson")}
					<ChevronRight className="h-3 w-3 ml-1" />
				</Button>
			</div>

			<div>
				<h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
					{t("courseContent")}
				</h4>
				<ScrollArea className="h-[calc(100vh-280px)]">
					<div className="space-y-0.5">
						{lessons.map((lesson, index) => (
							<button
								key={lesson.id}
								type="button"
								onClick={() => onLessonSelect(lesson.id)}
								className={`w-full text-left px-2 py-1.5 rounded-md transition-colors hover:bg-muted ${
									lesson.id === currentLessonId
										? "bg-primary/10 border border-primary/20"
										: ""
								}`}
							>
								<div className="flex items-center gap-2">
									{lesson.completed ? (
										<CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
									) : (
										<Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
									)}
									<span className="text-[10px] font-mono text-muted-foreground w-4 shrink-0">
										{index + 1}
									</span>
									<div className="flex-1 min-w-0">
										<p
											className={`text-xs truncate ${
												lesson.id === currentLessonId
													? "font-medium text-primary"
													: ""
											}`}
										>
											{lesson.title}
										</p>
									</div>
									<span className="text-[10px] text-muted-foreground shrink-0">
										{formatDuration(lesson.duration)}
									</span>
								</div>
							</button>
						))}
					</div>
				</ScrollArea>
			</div>
		</div>
	);
}
