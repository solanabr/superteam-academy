'use client';

import { useParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useI18n } from '@/i18n';
import { useCourse, useEnrollment, useEnroll } from '@/hooks/useProgram';
import { countCompletedLessons } from '@/lib/program';
import { finalizeCourse, issueCredential } from '@/lib/api';
import { recordActivity } from '@/lib/streak';
import { DIFFICULTY_LABELS, TRACK_LABELS } from '@/config/constants';
import BitmapProgress from '@/components/course/BitmapProgress';
import LessonList from '@/components/course/LessonList';
import ConnectButton from '@/components/wallet/ConnectButton';
import Link from 'next/link';
import { useState, useCallback } from 'react';

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { t } = useI18n();
  const { publicKey, connected } = useWallet();
  const { course, loading: courseLoading } = useCourse(courseId);
  const { enrollment, loading: enrollLoading, refresh } = useEnrollment(courseId);
  const { enroll, loading: enrolling } = useEnroll();
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleEnroll = useCallback(async () => {
    try {
      setError(null);
      await enroll(courseId);
      recordActivity();
      refresh();
    } catch (e: any) {
      setError(e.message);
    }
  }, [courseId, enroll, refresh]);

  const handleFinalize = useCallback(async () => {
    if (!publicKey) return;
    setActionLoading(true);
    setError(null);
    try {
      await finalizeCourse(courseId, publicKey.toBase58());
      recordActivity();
      setSuccess(t('course.courseCompleted'));
      refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }, [courseId, publicKey, refresh, t]);

  const handleClaimCredential = useCallback(async () => {
    if (!publicKey || !course) return;
    setActionLoading(true);
    setError(null);
    try {
      const name = `${TRACK_LABELS[course.trackId] || 'Track'} Credential`;
      await issueCredential(courseId, publicKey.toBase58(), name, '', 1, 0);
      recordActivity();
      setSuccess(t('course.claimYourCredential'));
      refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }, [courseId, publicKey, course, refresh, t]);

  if (courseLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-surface-800" />
          <div className="h-4 w-96 rounded bg-surface-800" />
          <div className="h-64 rounded-2xl bg-surface-800" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold mb-2">Course not found</h2>
        <Link href="/" className="btn-secondary mt-4 inline-block">{t('common.back')}</Link>
      </div>
    );
  }

  const completedCount = enrollment ? countCompletedLessons(enrollment.lessonFlags) : 0;
  const allDone = completedCount === course.lessonCount;
  const isFinalized = enrollment?.completedAt !== null && enrollment?.completedAt !== undefined;
  const hasCredential = enrollment?.credentialAsset !== null && enrollment?.credentialAsset !== undefined;
  const totalXp = course.xpPerLesson * course.lessonCount + Math.floor((course.xpPerLesson * course.lessonCount) / 2);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-16">
      <Link href="/" className="btn-ghost mb-6 inline-flex">{t('common.back')}</Link>

      {/* Course Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="rounded-full bg-brand-600/10 px-3 py-1 text-sm text-brand-400">
            {TRACK_LABELS[course.trackId] || `Track ${course.trackId}`}
          </span>
          <span className={`rounded-full px-3 py-1 text-sm ${
            course.difficulty === 1 ? 'bg-green-500/10 text-green-400'
              : course.difficulty === 2 ? 'bg-yellow-500/10 text-yellow-400'
              : 'bg-red-500/10 text-red-400'
          }`}>
            {DIFFICULTY_LABELS[course.difficulty]}
          </span>
          {course.prerequisite && (
            <span className="rounded-full bg-orange-500/10 px-3 py-1 text-sm text-orange-400">
              {t('courses.prerequisite')}
            </span>
          )}
        </div>

        <h1 className="text-3xl font-bold sm:text-4xl">
          {courseId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </h1>

        <div className="mt-4 flex flex-wrap gap-6 text-sm text-surface-200">
          <span>{course.lessonCount} {t('courses.lessons')}</span>
          <span>{course.xpPerLesson} {t('courses.xpPerLesson')}</span>
          <span className="font-medium text-accent-400">{totalXp} {t('courses.totalXp')}</span>
          <span>{course.totalEnrollments} {t('courses.enrolled')}</span>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-sm text-green-400">
          {success}
        </div>
      )}

      {/* Enrollment state */}
      {!connected ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">🔗</div>
          <p className="text-lg text-surface-200 mb-6">{t('course.notEnrolled')}</p>
          <ConnectButton />
        </div>
      ) : !enrollment ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">🚀</div>
          <p className="text-lg text-surface-200 mb-6">{t('course.enrollToStart')}</p>
          <button onClick={handleEnroll} disabled={enrolling} className="btn-primary text-base">
            {enrolling ? t('common.loading') : t('courses.enrollNow')}
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Progress */}
          <div className="card">
            <BitmapProgress
              lessonFlags={enrollment.lessonFlags}
              lessonCount={course.lessonCount}
              size="md"
            />
          </div>

          {/* Action buttons */}
          {allDone && !isFinalized && (
            <button onClick={handleFinalize} disabled={actionLoading} className="btn-primary w-full text-base">
              {actionLoading ? t('common.loading') : t('course.finalize')}
            </button>
          )}
          {isFinalized && !hasCredential && (
            <button onClick={handleClaimCredential} disabled={actionLoading} className="btn-primary w-full text-base">
              {actionLoading ? t('common.loading') : t('course.claim')}
            </button>
          )}
          {isFinalized && hasCredential && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6 text-center">
              <div className="text-3xl mb-2">🎓</div>
              <p className="text-green-400 font-semibold">{t('course.courseCompleted')}</p>
            </div>
          )}

          {/* Lesson list */}
          <LessonList
            courseId={courseId}
            lessonCount={course.lessonCount}
            enrollment={enrollment}
            onComplete={() => {
              recordActivity();
              refresh();
            }}
          />
        </div>
      )}
    </div>
  );
}
