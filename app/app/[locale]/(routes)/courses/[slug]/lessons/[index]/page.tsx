/**
 * Lesson View page — /courses/[slug]/lessons/[index]
 *
 * Split-pane layout: lesson content (left) + code editor (right).
 * Fetches lesson content from Arweave and manages completion state.
 *
 * In mock mode, auto-enrolls user so challenges are accessible.
 */
'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Link } from '@/context/i18n/navigation';
import { useCourseDetails } from '@/context/hooks/useCourseDetails';
import {
    useLessonCompletion,
    useCourseProgress,
    isLessonDone,
} from '@/context/hooks/useLessonCompletion';
import { SplitLayout } from '@/components/editor/SplitLayout';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { ChallengePanel } from '@/components/editor/ChallengePanel';
import { VideoPlayer } from '@/components/lesson/VideoPlayer';
import { LessonContent } from '@/components/lesson/LessonContent';
import { LessonNavigation } from '@/components/lesson/LessonNavigation';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';

const MOCK_MODE = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

export default function LessonViewPage() {
    const params = useParams<{ slug: string; index: string }>();
    const courseId = params.slug;
    const lessonIndex = parseInt(params.index, 10);

    // Data hooks
    const { data: course, isLoading: courseLoading } = useCourseDetails(courseId);
    const progress = useCourseProgress(courseId, course?.lessonCount ?? 0);
    const {
        completeLesson,
        isCompleting,
        completionStep,
    } = useLessonCompletion(courseId);

    // Lesson content from Arweave
    const [lessonContent, setLessonContent] = useState<string | null>(null);
    const [isContentLoading, setIsContentLoading] = useState(true);

    const lesson = course?.lessons?.[lessonIndex] ?? null;
    const isCompleted = isLessonDone(progress.data, lessonIndex);
    const isChallenge = lesson?.type === 'challenge' && !!lesson.challenge;
    const isVideo = lesson?.type === 'video';

    // Fetch individual lesson content
    useEffect(() => {
        // In mock mode, use the content field from the lesson data directly
        if (MOCK_MODE) {
            if (lesson && 'content' in lesson && typeof (lesson as Record<string, unknown>).content === 'string') {
                setLessonContent((lesson as Record<string, unknown>).content as string);
            } else {
                setLessonContent(null);
            }
            setIsContentLoading(false);
            return;
        }

        if (!lesson?.contentTxId) {
            setIsContentLoading(false);
            return;
        }

        const controller = new AbortController();

        async function fetchContent() {
            try {
                setIsContentLoading(true);
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_ARWEAVE_GATEWAY || 'https://arweave.net'}/${lesson!.contentTxId}`,
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    setLessonContent(null);
                    return;
                }

                const text = await response.text();
                setLessonContent(text);
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') return;
                console.error('Failed to fetch lesson content:', error);
                setLessonContent(null);
            } finally {
                setIsContentLoading(false);
            }
        }

        fetchContent();

        return () => controller.abort();
    }, [lesson?.contentTxId, lesson]);

    // Loading state
    if (courseLoading || !course) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-green-emerald" />
                    <p className="text-sm font-supreme">Loading lesson...</p>
                </div>
            </div>
        );
    }

    // Invalid lesson index
    if (!lesson || isNaN(lessonIndex) || lessonIndex < 0 || lessonIndex >= course.lessonCount) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-foreground/80 mb-2">Lesson Not Found</h2>
                    <p className="text-muted-foreground mb-6">This lesson does not exist in this course.</p>
                    <Link href={`/courses/${courseId}`} className="text-brand-green-emerald font-semibold hover:underline">
                        Back to Course
                    </Link>
                </div>
            </div>
        );
    }

    const handleComplete = () => {
        completeLesson(lessonIndex);
    };

    // Determine the right pane content based on lesson type
    const rightPane = isVideo ? (
        <VideoPlayer
            videoUrl={lesson.videoUrl}
            videoFileRef={lesson.videoFileRef}
            title={lesson.title}
        />
    ) : isChallenge ? (
        <ChallengePanel
            challenge={lesson.challenge!}
            hints={lesson.hints}
            isCompleted={isCompleted}
            onComplete={handleComplete}
            xpReward={course.xpPerLesson}
        />
    ) : (
        <CodeEditor
            language="rust"
            starterCode={`// ${lesson.title}\n// Write your code here\n`}
            isCompleted={isCompleted}
            onChange={() => { }}
        />
    );

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            {/* Top Bar */}
            <header className="flex items-center gap-4 px-4 sm:px-5 py-2.5 bg-card/80 backdrop-blur-md border-b border-border shrink-0">
                <Link
                    href={`/courses/${courseId}`}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 truncate max-w-[300px]"
                >
                    <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                    {course.title}
                </Link>
                <span className="text-xs text-muted-foreground/50 ml-auto">
                    Lesson {lessonIndex + 1} of {course.lessonCount}
                </span>
                {isCompleted && (
                    <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-brand-green-emerald bg-brand-green-emerald/10 border border-brand-green-emerald/20 px-2.5 py-0.5 rounded-full">
                        <Check className="w-3 h-3" />
                        Done
                    </span>
                )}
            </header>

            {/* Split: Content + Editor */}
            <div className="flex-1 overflow-hidden">
                <SplitLayout
                    left={
                        <LessonContent
                            lesson={lesson}
                            lessonContent={lessonContent}
                            isContentLoading={isContentLoading}
                            isCompleted={isCompleted}
                            isCompleting={isCompleting}
                            completionStep={completionStep}
                            onComplete={handleComplete}
                            xpReward={course.xpPerLesson}
                            hints={lesson.hints}
                            solutionCode={lesson.challenge?.solutionCode}
                        />
                    }
                    right={rightPane}
                    defaultLeftWidth={55}
                />
            </div>

            {/* Bottom Nav */}
            <LessonNavigation
                courseId={courseId}
                currentIndex={lessonIndex}
                totalLessons={course.lessonCount}
            />
        </div>
    );
}
