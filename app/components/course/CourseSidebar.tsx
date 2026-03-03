/**
 * Course sidebar — progress, CTA, stats, finalize.
 * Themed with Tailwind CSS variables for light/dark mode support.
 *
 * Accepts isMockMode to skip wallet-dependent enrollment UIs.
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
    isIssuingCredential: boolean;
    credentialResult: { action: string; credentialAsset: string; signature: string } | null;
    enrollError: Error | null;
    finalizeError: Error | null;
    onEnroll: () => void;
    onFinalize: () => void;
    walletConnected: boolean;
    isMockMode?: boolean;
}

export function CourseSidebar({
    course,
    progress,
    isEnrolling,
    isFinalizing,
    isIssuingCredential,
    credentialResult,
    enrollError,
    finalizeError,
    onEnroll,
    onFinalize,
    walletConnected,
    isMockMode = false,
}: CourseSidebarProps) {
    const t = useTranslations('courses');
    const tc = useTranslations('common');
    const tl = useTranslations('lesson');
    const trackColor = getTrackColor(course.trackId);
    const totalXp = calculateCourseTotalXp(course.xpPerLesson, course.lessonCount);
    const isEnrolled = isMockMode ? true : (progress?.isEnrolled ?? false);
    const isFullyCompleted = progress?.isFullyCompleted ?? false;
    const progressPercent = isMockMode ? 0 : (progress?.progressPercent ?? 0);
    const completedCount = isMockMode ? 0 : (progress?.completedCount ?? 0);
    const isFinalized = !!progress?.enrollment?.completedAt;

    // Estimated duration: ~15min per lesson
    const estimatedMinutes = course.lessonCount * 15;
    const hours = Math.floor(estimatedMinutes / 60);
    const mins = estimatedMinutes % 60;
    const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    return (
        <aside className="sticky top-20 bg-card/50 border border-border rounded-2xl p-6 flex flex-col gap-5">
            {/* Progress Ring */}
            {isEnrolled && !isMockMode && (
                <div className="flex flex-col items-center gap-2">
                    <div className="relative w-[120px] h-[120px]">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <circle
                                cx="50" cy="50" r="42"
                                fill="none"
                                className="stroke-border"
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
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-extrabold text-foreground">{progressPercent}%</span>
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground font-supreme">
                        {tl('progress', { current: completedCount, total: course.lessonCount })}
                    </div>
                </div>
            )}

            {/* Mock mode enrolled badge */}
            {isMockMode && (
                <div className="text-center py-3 rounded-xl bg-brand-green-emerald/10 border border-brand-green-emerald/20 text-brand-green-emerald text-sm font-semibold font-supreme">
                    ✅ Auto-enrolled (Mock Mode)
                </div>
            )}

            {/* CTA Button */}
            {!isMockMode && (
                <div>
                    {!walletConnected ? (
                        <button className="w-full py-3.5 rounded-xl text-sm font-bold bg-muted text-muted-foreground cursor-not-allowed" disabled>
                            {t('connectWalletToEnroll')}
                        </button>
                    ) : !isEnrolled ? (
                        <>
                            <button
                                className={`w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all ${enrollError ? 'bg-destructive/15 border border-destructive/30 text-destructive' : 'hover:-translate-y-0.5 shadow-md hover:shadow-lg'}`}
                                onClick={onEnroll}
                                disabled={isEnrolling}
                                style={!enrollError ? { background: `linear-gradient(135deg, ${trackColor}, ${trackColor}cc)` } : undefined}
                            >
                                {isEnrolling ? t('enrolling') : enrollError ? `❌ ${tc('retry')}` : t('enrollNow')}
                            </button>
                            {enrollError && <p className="mt-2 text-xs text-destructive/70 text-center font-supreme">{enrollError.message}</p>}
                        </>
                    ) : isFullyCompleted && !isFinalized ? (
                        <>
                            <button
                                className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${finalizeError ? 'bg-destructive/15 border border-destructive/30 text-destructive' : 'bg-gradient-to-r from-brand-yellow to-orange-500 text-brand-black hover:-translate-y-0.5'}`}
                                onClick={onFinalize}
                                disabled={isFinalizing}
                            >
                                {isFinalizing ? t('finalizing') : finalizeError ? `❌ ${tc('retry')}` : t('finalizeClaim')}
                            </button>
                            {finalizeError && <p className="mt-2 text-xs text-destructive/70 text-center font-supreme">{finalizeError.message}</p>}
                        </>
                    ) : isFinalized ? (
                        <div className="text-center py-3.5 rounded-xl bg-brand-green-emerald/10 border border-brand-green-emerald/20 text-brand-green-emerald text-sm font-semibold flex flex-col gap-2">
                            <div>✅ {t('completed')}</div>
                            {isIssuingCredential && (
                                <div className="text-xs text-brand-yellow/80 animate-pulse">
                                    🔄 Minting credential NFT...
                                </div>
                            )}
                            {credentialResult && (
                                <a
                                    href={`https://explorer.solana.com/address/${credentialResult.credentialAsset}?cluster=devnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-brand-green-emerald font-semibold hover:underline"
                                >
                                    🎓 View Credential NFT ↗
                                </a>
                            )}
                        </div>
                    ) : (
                        <a href={`#lesson-${completedCount}`} className="block w-full py-3.5 rounded-xl text-sm font-bold text-center text-white bg-gradient-to-r from-brand-green-emerald to-brand-green-dark hover:-translate-y-0.5 transition-all">
                            {t('continueLearning')}
                        </a>
                    )}
                </div>
            )}

            {/* Stats */}
            <div className="flex flex-col">
                {[
                    { label: tc('lessons'), value: course.lessonCount },
                    { label: tc('totalXp'), value: totalXp.toLocaleString(), isXp: true },
                    { label: t('xpPerLesson'), value: course.xpPerLesson },
                    { label: tc('duration'), value: durationStr },
                    { label: t('enrolled', { count: course.totalEnrollments }), value: course.totalEnrollments },
                    { label: t('completions'), value: course.totalCompletions },
                ].map((stat, i, arr) => (
                    <div
                        key={stat.label}
                        className={`flex justify-between items-center py-2.5 ${i < arr.length - 1 ? 'border-b border-border/50' : ''}`}
                    >
                        <span className="text-xs text-muted-foreground font-supreme">{stat.label}</span>
                        <span className={`text-sm font-semibold font-supreme ${stat.isXp ? 'text-brand-yellow' : 'text-foreground'}`}>
                            {stat.value}
                        </span>
                    </div>
                ))}
            </div>
        </aside>
    );
}
