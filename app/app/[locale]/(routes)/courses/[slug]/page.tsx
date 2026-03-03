/**
 * Course Detail page — /courses/[slug]
 *
 * Shows course overview, lesson list, enrollment CTA, and progress.
 * Uses on-chain data (Course PDA) + off-chain content (Arweave).
 *
 * In mock mode, auto-enrolls the user so all lessons are accessible
 * without a wallet or on-chain transaction.
 */
'use client';

import { useParams } from 'next/navigation';
import { Link } from '@/context/i18n/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCourseDetails } from '@/context/hooks/useCourseDetails';
import { useCourseProgress, useCourseFinalization } from '@/context/hooks/useLessonCompletion';
import { useEnroll, useEnrollmentStatus } from '@/context/hooks/useEnrollment';
import { CourseHeader } from '@/components/course/CourseHeader';
import { CourseSidebar } from '@/components/course/CourseSidebar';
import { LessonList } from '@/components/lesson/LessonList';
import { ArrowLeft } from 'lucide-react';

const MOCK_MODE = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

export default function CourseDetailPage() {
    const params = useParams<{ slug: string }>();
    const courseId = params.slug;
    const { publicKey } = useWallet();

    // Data hooks
    const { data: course, isLoading, error } = useCourseDetails(courseId);
    const progress = useCourseProgress(courseId, course?.lessonCount ?? 0);
    const { data: enrollmentStatus } = useEnrollmentStatus(courseId);
    const { enroll, isEnrolling, error: enrollError } = useEnroll(courseId);
    const { finalize, isFinalizing, isIssuingCredential, credentialResult, error: finalizeError } = useCourseFinalization(courseId);

    if (isLoading) {
        return (
            <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-8">
                <nav className="flex items-center gap-4 mb-8">
                    <Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4 inline mr-1" />
                        Courses
                    </Link>
                    <span className="text-sm font-bold font-display text-brand-green-emerald">
                        Superteam Academy
                    </span>
                </nav>
                <div className="h-[200px] rounded-2xl bg-muted/40 animate-pulse mb-8" />
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                    <div className="flex flex-col gap-2">
                        <div className="h-[72px] rounded-xl bg-muted/40 animate-pulse" />
                        <div className="h-[72px] rounded-xl bg-muted/40 animate-pulse" />
                        <div className="h-[72px] rounded-xl bg-muted/40 animate-pulse" />
                    </div>
                    <div className="h-[400px] rounded-2xl bg-muted/40 animate-pulse" />
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-8">
                <nav className="flex items-center gap-4 mb-8">
                    <Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4 inline mr-1" />
                        Courses
                    </Link>
                    <span className="text-sm font-bold font-display text-brand-green-emerald">
                        Superteam Academy
                    </span>
                </nav>
                <div className="text-center py-20">
                    <h2 className="text-xl font-bold text-foreground/80 mb-2">Course Not Found</h2>
                    <p className="text-muted-foreground mb-6">{error?.message ?? 'This course could not be loaded.'}</p>
                    <Link href="/courses" className="text-brand-green-emerald font-semibold hover:underline">
                        Browse all courses
                    </Link>
                </div>
            </div>
        );
    }

    // In mock mode, auto-enroll without wallet or on-chain transaction
    const isEnrolled = MOCK_MODE ? true : (progress.data?.isEnrolled ?? false);

    return (
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-8">
            <nav className="flex items-center gap-4 mb-8">
                <Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    Courses
                </Link>
                <span className="text-sm font-bold font-display text-brand-green-emerald">
                    Superteam Academy
                </span>
            </nav>

            <CourseHeader course={course} />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 mt-8 items-start">
                <div>
                    <LessonList
                        courseId={courseId}
                        lessons={course.lessons}
                        progress={progress.data}
                        isEnrolled={isEnrolled}
                    />
                </div>

                <CourseSidebar
                    course={course}
                    progress={progress.data}
                    isEnrolling={isEnrolling}
                    isFinalizing={isFinalizing}
                    isIssuingCredential={isIssuingCredential}
                    credentialResult={credentialResult}
                    enrollError={enrollError}
                    finalizeError={finalizeError}
                    onEnroll={() => enroll(undefined)}
                    onFinalize={() => finalize()}
                    walletConnected={MOCK_MODE ? true : !!publicKey}
                    isMockMode={MOCK_MODE}
                />
            </div>
        </div>
    );
}
