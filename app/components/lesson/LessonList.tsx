/**
 * Lesson list component — shows lessons with completion status.
 */
'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Lesson } from '@/context/types/course';
import type { CourseProgressData } from '@/context/hooks/useLessonCompletion';
import { isLessonDone } from '@/context/hooks/useLessonCompletion';

interface LessonListProps {
    courseId: string;
    lessons: Lesson[];
    progress: CourseProgressData | undefined;
    isEnrolled: boolean;
}

export function LessonList({ courseId, lessons, progress, isEnrolled }: LessonListProps) {
    const t = useTranslations('lesson');
    return (
        <div className="lesson-list">
            <h2 className="list-title">{t('courseContent')}</h2>
            <div className="lessons">
                {lessons.map((lesson, i) => {
                    const completed = isLessonDone(progress, lesson.index);
                    const isLocked = !isEnrolled;
                    const duration = lesson.duration;
                    const mins = Math.ceil(duration / 60);

                    return (
                        <div key={lesson.index} id={`lesson-${lesson.index}`}>
                            {isLocked ? (
                                <div className="lesson-item lesson-locked">
                                    <div className="lesson-index">{i + 1}</div>
                                    <div className="lesson-info">
                                        <span className="lesson-title">{lesson.title}</span>
                                        <span className="lesson-meta">{mins}m • {t('enrollToAccess')}</span>
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    href={`/courses/${courseId}/lessons/${lesson.index}`}
                                    className={`lesson-item ${completed ? 'lesson-completed' : 'lesson-available'}`}
                                >
                                    <div className={`lesson-index ${completed ? 'index-done' : ''}`}>
                                        {completed ? '✓' : i + 1}
                                    </div>
                                    <div className="lesson-info">
                                        <span className="lesson-title">{lesson.title}</span>
                                        <span className="lesson-meta">
                                            {mins}m
                                            {lesson.type === 'challenge' && ` \u2022 Challenge`}
                                            {lesson.quiz && ` \u2022 ${t('quiz')}`}
                                            {completed && ` \u2022 ${t('completed')}`}
                                        </span>
                                    </div>
                                    <span className="lesson-arrow">→</span>
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
                .lesson-list {
                    margin-top: 32px;
                }
                .list-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.9);
                    margin: 0 0 16px;
                }
                .lessons {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .lesson-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 20px;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    transition: all 0.2s;
                    text-decoration: none;
                    color: inherit;
                }
                .lesson-available:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.12);
                    transform: translateX(4px);
                }
                .lesson-locked {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .lesson-completed {
                    border-color: rgba(20, 241, 149, 0.15);
                }
                .lesson-index {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    background: rgba(255, 255, 255, 0.06);
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.5);
                    flex-shrink: 0;
                }
                .index-done {
                    background: rgba(20, 241, 149, 0.15);
                    color: #14F195;
                }
                .lesson-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .lesson-title {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.85);
                }
                .lesson-meta {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.35);
                }
                .lesson-arrow {
                    font-size: 1rem;
                    color: rgba(255, 255, 255, 0.2);
                    transition: color 0.2s;
                }
                .lesson-available:hover .lesson-arrow {
                    color: rgba(255, 255, 255, 0.6);
                }
            `}</style>
        </div>
    );
}
