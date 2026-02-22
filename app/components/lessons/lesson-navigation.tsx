"use client";

import { ChevronLeft, ChevronRight, CheckCircle, Circle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

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
	const currentIndex = lessons.findIndex((lesson) => lesson.id === currentLessonId);
	const currentLesson = lessons[currentIndex];

	const formatDuration = (minutes: number) => {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) {
			return `${hours}h ${mins}m`;
		}
		return `${mins}m`;
	};

	return (
		<div className="space-y-4">
			<div className="flex gap-2">
				<Button
					variant="outline"
					onClick={onPrevious}
					disabled={!hasPrevious}
					className="flex-1"
				>
					<ChevronLeft className="h-4 w-4 mr-2" />
					Previous Lesson
				</Button>
				<Button variant="outline" onClick={onNext} disabled={!hasNext} className="flex-1">
					Next Lesson
					<ChevronRight className="h-4 w-4 ml-2" />
				</Button>
			</div>

			{currentLesson && (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium">Current Lesson</CardTitle>
					</CardHeader>
					<CardContent className="pt-0">
						<div className="flex items-center gap-3">
							{currentLesson.completed ? (
								<CheckCircle className="h-5 w-5 text-green-500" />
							) : (
								<Circle className="h-5 w-5 text-muted-foreground" />
							)}
							<div className="flex-1 min-w-0">
								<p className="font-medium truncate">{currentLesson.title}</p>
								<p className="text-sm text-muted-foreground">
									{formatDuration(currentLesson.duration)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle className="text-sm font-medium">Course Content</CardTitle>
				</CardHeader>
				<CardContent className="pt-0">
					<ScrollArea className="h-96">
						<div className="space-y-2">
							{lessons.map((lesson, index) => (
								<button
									key={lesson.id}
									type="button"
									onClick={() => onLessonSelect(lesson.id)}
									className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-muted ${
										lesson.id === currentLessonId
											? "bg-primary/10 border border-primary/20"
											: ""
									}`}
								>
									<div className="flex items-center gap-3">
										<div className="flex items-center gap-2">
											{lesson.completed ? (
												<CheckCircle className="h-4 w-4 text-green-500" />
											) : (
												<Circle className="h-4 w-4 text-muted-foreground" />
											)}
											<span className="text-sm font-mono text-muted-foreground w-6">
												{index + 1}
											</span>
										</div>
										<div className="flex-1 min-w-0">
											<p
												className={`text-sm truncate ${
													lesson.id === currentLessonId
														? "font-medium text-primary"
														: ""
												}`}
											>
												{lesson.title}
											</p>
											<p className="text-xs text-muted-foreground">
												{formatDuration(lesson.duration)}
											</p>
										</div>
									</div>
								</button>
							))}
						</div>
					</ScrollArea>
				</CardContent>
			</Card>
		</div>
	);
}
