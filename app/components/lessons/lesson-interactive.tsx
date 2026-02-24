"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LessonVideoPlayer } from "@/components/lessons/lesson-video-player";
import { LessonQuiz } from "@/components/lessons/lesson-quiz";
import { LessonNavigation } from "@/components/lessons/lesson-navigation";

interface LessonInteractiveProps {
	courseId: string;
	lessonId: string;
	lessonIndex: number;
	videoUrl: string;
	lessonTitle: string;
	quiz: {
		id: string;
		title: string;
		questions: Array<{
			id: string;
			question: string;
			options: string[];
			correctAnswer: number;
			explanation?: string;
		}>;
		passingScore: number;
		timeLimit?: number;
	};
	lessons: Array<{
		id: string;
		title: string;
		completed: boolean;
		duration: number;
	}>;
	hasPrevious: boolean;
	hasNext: boolean;
}

export function LessonVideoPlayerWrapper({
	courseId,
	lessonIndex,
	videoUrl,
	lessonTitle,
}: Pick<LessonInteractiveProps, "courseId" | "lessonIndex" | "videoUrl" | "lessonTitle">) {
	const [completing, setCompleting] = useState(false);

	const handleComplete = useCallback(async () => {
		if (completing) return;
		setCompleting(true);
		try {
			const res = await fetch("/api/lessons/complete", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ courseId, lessonIndex }),
			});
			if (!res.ok) {
				console.error("Failed to complete lesson:", await res.text());
			}
		} catch (error) {
			console.error("Lesson completion error:", error);
		} finally {
			setCompleting(false);
		}
	}, [courseId, lessonIndex, completing]);

	return (
		<LessonVideoPlayer videoUrl={videoUrl} title={lessonTitle} onComplete={handleComplete} />
	);
}

export function LessonQuizWrapper({
	courseId,
	lessonIndex,
	quiz,
}: Pick<LessonInteractiveProps, "courseId" | "lessonIndex" | "quiz">) {
	const handleQuizComplete = useCallback(
		async (_score: number, passed: boolean) => {
			if (passed) {
				try {
					await fetch("/api/lessons/complete", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ courseId, lessonIndex }),
					});
				} catch (error) {
					console.error("Quiz completion error:", error);
				}
			}
		},
		[courseId, lessonIndex]
	);

	return <LessonQuiz quiz={quiz} onComplete={handleQuizComplete} />;
}

export function LessonNavigationWrapper({
	courseId,
	lessonId,
	lessons,
	hasPrevious,
	hasNext,
}: Pick<LessonInteractiveProps, "courseId" | "lessonId" | "lessons" | "hasPrevious" | "hasNext">) {
	const router = useRouter();

	const handleLessonSelect = useCallback(
		(selectedLessonId: string) => {
			router.push(`/courses/${courseId}/learn?lesson=${selectedLessonId}`);
		},
		[courseId, router]
	);

	return (
		<LessonNavigation
			currentLessonId={lessonId}
			lessons={lessons}
			onLessonSelect={handleLessonSelect}
			hasPrevious={hasPrevious}
			hasNext={hasNext}
		/>
	);
}

export function LessonMarkCompleteWrapper({
	courseId,
	lessonIndex,
	label,
}: {
	courseId: string;
	lessonIndex: number;
	label: string;
}) {
	const router = useRouter();
	const [completing, setCompleting] = useState(false);
	const [completed, setCompleted] = useState(false);

	const handleMarkComplete = useCallback(async () => {
		if (completing || completed) return;
		setCompleting(true);
		try {
			const res = await fetch("/api/lessons/complete", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ courseId, lessonIndex }),
			});
			if (res.ok) {
				setCompleted(true);
				router.refresh();
			} else {
				console.error("Failed to mark lesson complete:", await res.text());
			}
		} catch (error) {
			console.error("Mark complete error:", error);
		} finally {
			setCompleting(false);
		}
	}, [courseId, lessonIndex, completing, completed, router]);

	return (
		<Button
			variant={completed ? "default" : "outline"}
			className="w-full justify-start gap-2"
			onClick={handleMarkComplete}
			disabled={completing || completed}
		>
			{completing ? (
				<Loader2 className="h-4 w-4 animate-spin" />
			) : (
				<CheckCircle className={`h-4 w-4 ${completed ? "text-green-500" : ""}`} />
			)}
			{completed ? "Completed!" : completing ? "Completing..." : label}
		</Button>
	);
}
