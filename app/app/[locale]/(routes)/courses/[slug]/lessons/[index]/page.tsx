/**
 * Lesson View page — /courses/[slug]/lessons/[index]
 *
 * Split-pane layout: lesson content (left) + code editor (right).
 * Fetches lesson content from Arweave and manages completion state.
 */
'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCourseDetails } from '@/context/hooks/useCourseDetails';
import {
    useLessonCompletion,
    useCourseProgress,
    isLessonDone,
} from '@/context/hooks/useLessonCompletion';
import { SplitLayout } from '@/components/editor/SplitLayout';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { ChallengePanel } from '@/components/editor/ChallengePanel';
import { LessonContent } from '@/components/lesson/LessonContent';
import { LessonNavigation } from '@/components/lesson/LessonNavigation';

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

    // Fetch individual lesson content
    useEffect(() => {
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
    }, [lesson?.contentTxId]);

    // Loading state
    if (courseLoading || !course) {
        return (
            <div className="lesson-page">
                <div className="lesson-loading">
                    <div className="spinner" />
                    <p>Loading lesson...</p>
                </div>
                <style jsx>{`
                    .lesson-page { min-height: 100vh; background: #0a0a0f; color: white; display: flex; align-items: center; justify-content: center; }
                    .lesson-loading { text-align: center; color: rgba(255,255,255,0.4); }
                    .spinner { width: 32px; height: 32px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #9945FF; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 12px; }
                    @keyframes spin { to { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    // Invalid lesson index
    if (!lesson || isNaN(lessonIndex) || lessonIndex < 0 || lessonIndex >= course.lessonCount) {
        return (
            <div className="lesson-page">
                <div className="lesson-error">
                    <h2>Lesson Not Found</h2>
                    <p>This lesson does not exist in this course.</p>
                    <Link href={`/courses/${courseId}`} className="error-link">
                        Back to Course
                    </Link>
                </div>
                <style jsx>{`
                    .lesson-page { min-height: 100vh; background: #0a0a0f; color: white; display: flex; align-items: center; justify-content: center; }
                    .lesson-error { text-align: center; }
                    .lesson-error h2 { font-size: 1.3rem; color: rgba(255,255,255,0.8); margin: 0 0 8px; }
                    .lesson-error p { color: rgba(255,255,255,0.4); margin: 0 0 20px; }
                    .error-link { color: #9945FF; text-decoration: none; font-weight: 600; }
                `}</style>
            </div>
        );
    }

    const handleComplete = () => {
        completeLesson(lessonIndex);
    };

    // Determine the right pane content based on lesson type
    const rightPane = isChallenge ? (
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
        <div className="lesson-page">
            {/* Top Bar */}
            <header className="lesson-header">
                <Link href={`/courses/${courseId}`} className="back-link">
                    {'\u2190'} {course.title}
                </Link>
                <span className="lesson-indicator">
                    Lesson {lessonIndex + 1} of {course.lessonCount}
                </span>
                {isCompleted && <span className="done-badge">{'\u2713'} Done</span>}
            </header>

            {/* Split: Content + Editor */}
            <div className="lesson-body">
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

            <style jsx>{`
                .lesson-page {
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                    background: #0a0a0f;
                    color: white;
                    overflow: hidden;
                }
                .lesson-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 10px 20px;
                    background: rgba(10, 10, 15, 0.95);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    backdrop-filter: blur(12px);
                    flex-shrink: 0;
                }
                .back-link {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.5);
                    text-decoration: none;
                    transition: color 0.2s;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 300px;
                }
                .back-link:hover {
                    color: rgba(255, 255, 255, 0.85);
                }
                .lesson-indicator {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.3);
                    margin-left: auto;
                }
                .done-badge {
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: #14F195;
                    background: rgba(20, 241, 149, 0.1);
                    padding: 3px 10px;
                    border-radius: 20px;
                    border: 1px solid rgba(20, 241, 149, 0.2);
                }
                .lesson-body {
                    flex: 1;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}
