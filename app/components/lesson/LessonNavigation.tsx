/**
 * Lesson navigation — prev/next + lesson indicator.
 */
'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface LessonNavigationProps {
    courseId: string;
    currentIndex: number;
    totalLessons: number;
}

export function LessonNavigation({
    courseId,
    currentIndex,
    totalLessons,
}: LessonNavigationProps) {
    const t = useTranslations('lesson');
    const tc = useTranslations('common');
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < totalLessons - 1;

    return (
        <nav className="lesson-nav">
            <div className="nav-left">
                {hasPrev ? (
                    <Link
                        href={`/courses/${courseId}/lessons/${currentIndex - 1}`}
                        className="nav-btn"
                    >
                        ← {tc('previous')}
                    </Link>
                ) : (
                    <Link href={`/courses/${courseId}`} className="nav-btn nav-back">
                        {t('backToCourse')}
                    </Link>
                )}
            </div>

            <div className="nav-indicator">
                {currentIndex + 1} / {totalLessons}
            </div>

            <div className="nav-right">
                {hasNext ? (
                    <Link
                        href={`/courses/${courseId}/lessons/${currentIndex + 1}`}
                        className="nav-btn"
                    >
                        {tc('next')} →
                    </Link>
                ) : (
                    <Link href={`/courses/${courseId}`} className="nav-btn nav-finish">
                        {t('finish')}
                    </Link>
                )}
            </div>

            <style jsx>{`
                .lesson-nav {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 24px;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                    background: rgba(10, 10, 15, 0.95);
                    backdrop-filter: blur(12px);
                }
                .nav-left, .nav-right {
                    flex: 1;
                }
                .nav-right {
                    text-align: right;
                }
                .nav-btn {
                    display: inline-block;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.6);
                    text-decoration: none;
                    transition: all 0.15s;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
                .nav-btn:hover {
                    color: rgba(255, 255, 255, 0.9);
                    background: rgba(255, 255, 255, 0.08);
                }
                .nav-back {
                    color: rgba(255, 255, 255, 0.4);
                }
                .nav-finish {
                    background: rgba(153, 69, 255, 0.1);
                    border-color: rgba(153, 69, 255, 0.2);
                    color: #9945FF;
                }
                .nav-indicator {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.35);
                    font-weight: 500;
                }
            `}</style>
        </nav>
    );
}
