/**
 * Course sidebar — progress, CTA, stats, finalize.
 */
'use client';

import { useTranslations } from 'next-intl';
import type { CourseWithDetails } from '@/context/types/course';
import type { CourseProgressData } from '@/context/hooks/useLessonCompletion';
import { calculateCourseTotalXp } from '@/context/xp-calculations';
import { getTrackColor } from '@/context/course/tracks';

interface CourseSidebarProps {
    course: CourseWithDetails;
    progress: CourseProgressData | undefined;
    isEnrolling: boolean;
    isFinalizing: boolean;
    enrollError: Error | null;
    finalizeError: Error | null;
    onEnroll: () => void;
    onFinalize: () => void;
    walletConnected: boolean;
}

export function CourseSidebar({
    course,
    progress,
    isEnrolling,
    isFinalizing,
    enrollError,
    finalizeError,
    onEnroll,
    onFinalize,
    walletConnected,
}: CourseSidebarProps) {
    const t = useTranslations('courses');
    const tc = useTranslations('common');
    const tl = useTranslations('lesson');
    const trackColor = getTrackColor(course.trackId);
    const totalXp = calculateCourseTotalXp(course.xpPerLesson, course.lessonCount);
    const isEnrolled = progress?.isEnrolled ?? false;
    const isFullyCompleted = progress?.isFullyCompleted ?? false;
    const progressPercent = progress?.progressPercent ?? 0;
    const completedCount = progress?.completedCount ?? 0;
    const isFinalized = !!progress?.enrollment?.completedAt;

    // Estimated duration: ~15min per lesson
    const estimatedMinutes = course.lessonCount * 15;
    const hours = Math.floor(estimatedMinutes / 60);
    const mins = estimatedMinutes % 60;
    const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    return (
        <aside className="course-sidebar">
            {/* Progress Ring */}
            {isEnrolled && (
                <div className="progress-section">
                    <div className="progress-ring-container">
                        <svg viewBox="0 0 100 100" className="progress-ring">
                            <circle
                                cx="50" cy="50" r="42"
                                fill="none"
                                stroke="rgba(255,255,255,0.06)"
                                strokeWidth="8"
                            />
                            <circle
                                cx="50" cy="50" r="42"
                                fill="none"
                                stroke={trackColor}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 42}`}
                                strokeDashoffset={`${2 * Math.PI * 42 * (1 - progressPercent / 100)}`}
                                transform="rotate(-90 50 50)"
                                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                            />
                        </svg>
                        <div className="progress-text">
                            <span className="progress-percent">{progressPercent}%</span>
                        </div>
                    </div>
                    <div className="progress-label">
                        {tl('progress', { current: completedCount, total: course.lessonCount })}
                    </div>
                </div>
            )}

            {/* CTA Button */}
            <div className="cta-section">
                {!walletConnected ? (
                    <button className="cta-button cta-disabled" disabled>
                        {t('connectWalletToEnroll')}
                    </button>
                ) : !isEnrolled ? (
                    <>
                        <button
                            className={`cta-button ${enrollError ? 'cta-error' : 'cta-enroll'}`}
                            onClick={onEnroll}
                            disabled={isEnrolling}
                            style={!enrollError ? { background: `linear-gradient(135deg, ${trackColor}, ${trackColor}cc)` } : undefined}
                        >
                            {isEnrolling ? t('enrolling') : enrollError ? `❌ ${tc('retry')}` : t('enrollNow')}
                        </button>
                        {enrollError && <p className="cta-error-msg">{enrollError.message}</p>}
                    </>
                ) : isFullyCompleted && !isFinalized ? (
                    <>
                        <button
                            className={`cta-button ${finalizeError ? 'cta-error' : 'cta-finalize'}`}
                            onClick={onFinalize}
                            disabled={isFinalizing}
                        >
                            {isFinalizing ? t('finalizing') : finalizeError ? `❌ ${tc('retry')}` : t('finalizeClaim')}
                        </button>
                        {finalizeError && <p className="cta-error-msg">{finalizeError.message}</p>}
                    </>
                ) : isFinalized ? (
                    <div className="cta-completed">✅ {t('completed')}</div>
                ) : (
                    <a href={`#lesson-${completedCount}`} className="cta-button cta-continue">
                        {t('continueLearning')}
                    </a>
                )}
            </div>

            {/* Stats */}
            <div className="sidebar-stats">
                <div className="stat-row">
                    <span className="stat-label">{tc('lessons')}</span>
                    <span className="stat-value">{course.lessonCount}</span>
                </div>
                <div className="stat-row">
                    <span className="stat-label">{tc('totalXp')}</span>
                    <span className="stat-value xp-value">{totalXp.toLocaleString()}</span>
                </div>
                <div className="stat-row">
                    <span className="stat-label">{t('xpPerLesson')}</span>
                    <span className="stat-value">{course.xpPerLesson}</span>
                </div>
                <div className="stat-row">
                    <span className="stat-label">{tc('duration')}</span>
                    <span className="stat-value">{durationStr}</span>
                </div>
                <div className="stat-row">
                    <span className="stat-label">{t('enrolled', { count: course.totalEnrollments })}</span>
                    <span className="stat-value">{course.totalEnrollments}</span>
                </div>
                <div className="stat-row">
                    <span className="stat-label">{t('completions')}</span>
                    <span className="stat-value">{course.totalCompletions}</span>
                </div>
            </div>

            <style jsx>{`
                .course-sidebar {
                    position: sticky;
                    top: 80px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                .progress-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }
                .progress-ring-container {
                    position: relative;
                    width: 120px;
                    height: 120px;
                }
                .progress-ring {
                    width: 100%;
                    height: 100%;
                }
                .progress-text {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .progress-percent {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: rgba(255, 255, 255, 0.9);
                }
                .progress-label {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.4);
                }
                .cta-section {
                    padding: 0;
                }
                .cta-button {
                    display: block;
                    width: 100%;
                    padding: 14px;
                    border: none;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    font-weight: 700;
                    cursor: pointer;
                    text-align: center;
                    text-decoration: none;
                    transition: all 0.2s;
                    color: white;
                }
                .cta-enroll {
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                }
                .cta-enroll:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
                }
                .cta-enroll:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .cta-continue {
                    background: linear-gradient(135deg, #9945FF, #14F195);
                }
                .cta-continue:hover {
                    transform: translateY(-1px);
                }
                .cta-finalize {
                    background: linear-gradient(135deg, #FFD700, #FF8C00);
                    color: #000;
                }
                .cta-finalize:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .cta-error {
                    background: rgba(255, 107, 107, 0.15);
                    border: 1px solid rgba(255, 107, 107, 0.3);
                    color: #ff6b6b;
                }
                .cta-error-msg {
                    margin: 8px 0 0;
                    font-size: 0.72rem;
                    color: rgba(255, 107, 107, 0.7);
                    text-align: center;
                }
                .cta-disabled {
                    background: rgba(255, 255, 255, 0.08);
                    color: rgba(255, 255, 255, 0.35);
                    cursor: not-allowed;
                }
                .cta-completed {
                    text-align: center;
                    padding: 14px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #14F195;
                    background: rgba(20, 241, 149, 0.08);
                    border: 1px solid rgba(20, 241, 149, 0.2);
                    border-radius: 12px;
                }
                .sidebar-stats {
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                }
                .stat-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                }
                .stat-row:last-child {
                    border-bottom: none;
                }
                .stat-label {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.4);
                }
                .stat-value {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.85);
                }
                .xp-value {
                    color: rgba(255, 215, 0, 0.85);
                }
            `}</style>
        </aside>
    );
}
