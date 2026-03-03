/**
 * ActiveCourses — Peach pastel dashboard card.
 * Shows available courses with difficulty, lesson count, and enrollment.
 */
'use client';

import { useActiveCourses } from '@/context/hooks/useCourses';
import { DIFFICULTY_LABELS, type Difficulty } from '@/context/types/course';
import { BookOpen, Users, Layers } from 'lucide-react';
import { Link } from '@/context/i18n/navigation';

const DIFFICULTY_DOT: Record<number, string> = {
    1: '#15803d',
    2: '#b45309',
    3: '#dc2626',
};

export function ActiveCourses() {
    const { data: courses, isLoading } = useActiveCourses();

    return (
        <div
            className="rounded-3xl p-5 font-supreme shadow-sm"
            style={{ backgroundColor: 'var(--dash-card-peach)', color: '#1b231d', minHeight: 240 }}
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold font-display" style={{ color: '#1b231d' }}>
                    Courses
                </h2>
                <Link
                    href="/courses"
                    className="text-xs font-semibold hover:underline"
                    style={{ color: '#0f6a37' }}
                >
                    Browse all
                </Link>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
                            <div className="flex-1 space-y-1">
                                <div className="h-4 w-3/4 rounded animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
                                <div className="h-3 w-1/2 rounded animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : !courses || courses.length === 0 ? (
                <div className="text-center py-6">
                    <BookOpen className="w-8 h-8 mx-auto mb-2" style={{ color: '#5a4030' }} />
                    <p className="text-sm" style={{ color: '#5a4030' }}>No courses available yet</p>
                </div>
            ) : (
                <div className="overflow-y-auto hide-scrollbar" style={{ maxHeight: 180 }}>
                    <div className="space-y-2">
                        {courses.slice(0, 5).map((course) => {
                            const diffColor = DIFFICULTY_DOT[course.difficulty] || '#6366f1';

                            return (
                                <Link
                                    key={course.courseId}
                                    href={`/courses/${course.courseId}`}
                                    className="flex items-center gap-3 p-2.5 mx-0 rounded-2xl transition-colors"
                                    style={{ color: '#1b231d' }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.35)')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
                                    >
                                        <BookOpen className="w-5 h-5" style={{ color: diffColor }} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-semibold block truncate" style={{ color: '#1b231d' }}>
                                            Course {course.courseId}
                                        </span>
                                        <div className="flex items-center gap-3 mt-0.5 text-[11px]" style={{ color: '#5a4030' }}>
                                            <span className="flex items-center gap-1">
                                                <span
                                                    className="w-2 h-2 rounded-full inline-block"
                                                    style={{ backgroundColor: diffColor }}
                                                />
                                                {DIFFICULTY_LABELS[course.difficulty as Difficulty]}
                                            </span>
                                            <span className="flex items-center gap-0.5">
                                                <Layers className="w-3 h-3" />
                                                {course.lessonCount} lessons
                                            </span>
                                            <span className="flex items-center gap-0.5">
                                                <Users className="w-3 h-3" />
                                                {course.totalEnrollments}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
