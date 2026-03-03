/**
 * Course header component — title, track badge, difficulty, stats.
 */
'use client';

import { useTranslations } from 'next-intl';
import type { CourseWithDetails, Difficulty } from '@/context/types/course';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/context/types/course';
import { getTrackName, getTrackColor } from '@/context/course/tracks';
import { calculateCourseTotalXp, calculateCompletionBonus } from '@/context/xp-calculations';

interface CourseHeaderProps {
    course: CourseWithDetails;
}

export function CourseHeader({ course }: CourseHeaderProps) {
    const t = useTranslations('courses');
    const tc = useTranslations('common');
    const trackName = getTrackName(course.trackId);
    const trackColor = getTrackColor(course.trackId);
    const diffLabel = DIFFICULTY_LABELS[course.difficulty as Difficulty] ?? tc('unknown');
    const diffColorClass = DIFFICULTY_COLORS[course.difficulty as Difficulty] ?? '';
    const totalXp = calculateCourseTotalXp(course.xpPerLesson, course.lessonCount);
    const bonusXp = calculateCompletionBonus(course.xpPerLesson, course.lessonCount);

    return (
        <div className="course-header">
            <div
                className="header-accent"
                style={{
                    background: `linear-gradient(135deg, ${trackColor}44 0%, transparent 60%)`,
                }}
            />

            <div className="header-content">
                <div className="header-badges">
                    <span className="track-badge" style={{ color: trackColor, borderColor: `${trackColor}44` }}>
                        {trackName}
                    </span>
                    <span className={`difficulty-badge ${diffColorClass}`}>
                        {diffLabel}
                    </span>
                    <span className="level-badge">{t('level', { level: course.trackLevel })}</span>
                </div>

                <h1 className="course-title">{course.title}</h1>
                <p className="course-description">{course.description}</p>

                <div className="course-meta">
                    <div className="meta-item">
                        <span className="meta-icon">📚</span>
                        <span>{t('lessons', { count: course.lessonCount })}</span>
                    </div>
                    <div className="meta-item">
                        <span className="meta-icon">✨</span>
                        <span>{t('xpTotal', { total: totalXp.toLocaleString() })}</span>
                    </div>
                    <div className="meta-item">
                        <span className="meta-icon">🎁</span>
                        <span>{t('xpBonus', { bonus: bonusXp.toLocaleString() })}</span>
                    </div>
                    <div className="meta-item">
                        <span className="meta-icon">👥</span>
                        <span>{t('enrolled', { count: course.totalEnrollments })}</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .course-header {
                    position: relative;
                    border-radius: 20px;
                    overflow: hidden;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
                .header-accent {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                }
                .header-content {
                    position: relative;
                    padding: 32px;
                }
                .header-badges {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-bottom: 16px;
                }
                .track-badge {
                    font-size: 0.72rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    padding: 4px 12px;
                    border-radius: 20px;
                    border: 1px solid;
                    background: rgba(255, 255, 255, 0.03);
                }
                .difficulty-badge {
                    font-size: 0.72rem;
                    font-weight: 600;
                    padding: 4px 12px;
                    border-radius: 20px;
                    border: 1px solid;
                }
                .level-badge {
                    font-size: 0.68rem;
                    color: rgba(255, 255, 255, 0.4);
                    background: rgba(255, 255, 255, 0.06);
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-weight: 500;
                }
                .course-title {
                    font-size: 2rem;
                    font-weight: 800;
                    color: rgba(255, 255, 255, 0.95);
                    line-height: 1.2;
                    margin: 0 0 12px;
                }
                .course-description {
                    font-size: 1rem;
                    color: rgba(255, 255, 255, 0.5);
                    line-height: 1.6;
                    margin: 0 0 24px;
                    max-width: 640px;
                }
                .course-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                }
                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.5);
                }
                .meta-icon {
                    font-size: 1rem;
                }
                @media (max-width: 768px) {
                    .header-content {
                        padding: 20px;
                    }
                    .course-title {
                        font-size: 1.5rem;
                    }
                    .course-meta {
                        gap: 12px;
                    }
                }
            `}</style>
        </div>
    );
}
