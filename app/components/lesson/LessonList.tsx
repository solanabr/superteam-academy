/**
 * Lesson list component — shows lessons with completion status.
 * Themed with Tailwind CSS variables for light/dark mode support.
 */
'use client';

import { Link } from '@/context/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Check, Lock, ArrowRight, Video, Code2, HelpCircle } from 'lucide-react';
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
        <div className="mt-8">
            <h2 className="text-lg font-bold text-foreground mb-4 font-display">{t('courseContent')}</h2>
            <div className="flex flex-col gap-1">
                {lessons.map((lesson, i) => {
                    const completed = isLessonDone(progress, lesson.index);
                    const isLocked = !isEnrolled;
                    const duration = lesson.duration;
                    const mins = Math.ceil(duration / 60);

                    return (
                        <div key={lesson.index} id={`lesson-${lesson.index}`}>
                            {isLocked ? (
                                <div className="flex items-center gap-4 px-4 sm:px-5 py-4 rounded-xl bg-card/30 border border-border/50 opacity-50 cursor-not-allowed">
                                    <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-muted text-muted-foreground text-sm font-bold shrink-0">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 flex flex-col gap-1">
                                        <span className="text-sm font-semibold text-foreground/80 font-supreme">{lesson.title}</span>
                                        <span className="text-xs text-muted-foreground font-supreme">{mins}m • {t('enrollToAccess')}</span>
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    href={`/courses/${courseId}/lessons/${lesson.index}`}
                                    className={`group flex items-center gap-4 px-4 sm:px-5 py-4 rounded-xl border transition-all duration-200 hover:shadow-sm ${completed
                                            ? 'bg-brand-green-emerald/5 border-brand-green-emerald/15 hover:border-brand-green-emerald/30'
                                            : 'bg-card/30 border-border/50 hover:border-border hover:bg-card/60'
                                        }`}
                                >
                                    <div className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold shrink-0 ${completed
                                            ? 'bg-brand-green-emerald/15 text-brand-green-emerald'
                                            : 'bg-muted/60 text-muted-foreground'
                                        }`}>
                                        {completed ? <Check className="w-4 h-4" /> : i + 1}
                                    </div>
                                    <div className="flex-1 flex flex-col gap-1">
                                        <span className="text-sm font-semibold text-foreground font-supreme">{lesson.title}</span>
                                        <span className="text-xs text-muted-foreground font-supreme flex items-center gap-1.5">
                                            {mins}m
                                            {lesson.type === 'video' && (
                                                <span className="inline-flex items-center gap-0.5">
                                                    <Video className="w-3 h-3" /> Video
                                                </span>
                                            )}
                                            {lesson.type === 'challenge' && (
                                                <span className="inline-flex items-center gap-0.5">
                                                    <Code2 className="w-3 h-3" /> Challenge
                                                </span>
                                            )}
                                            {lesson.quiz && (
                                                <span className="inline-flex items-center gap-0.5">
                                                    <HelpCircle className="w-3 h-3" /> {t('quiz')}
                                                </span>
                                            )}
                                            {completed && (
                                                <span className="text-brand-green-emerald">• {t('completed')}</span>
                                            )}
                                        </span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
