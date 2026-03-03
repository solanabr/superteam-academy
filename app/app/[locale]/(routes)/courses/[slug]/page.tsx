/**
 * Course Detail page — /courses/[slug]
 *
 * Shows course overview, lesson list, enrollment CTA, and progress.
 * Uses on-chain data (Course PDA) + off-chain content (Arweave).
 */
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCourseDetails } from '@/context/hooks/useCourseDetails';
import { useCourseProgress, useCourseFinalization } from '@/context/hooks/useLessonCompletion';
import { useEnroll, useEnrollmentStatus } from '@/context/hooks/useEnrollment';
import { CourseHeader } from '@/components/course/CourseHeader';
import { CourseSidebar } from '@/components/course/CourseSidebar';
import { LessonList } from '@/components/lesson/LessonList';

export default function CourseDetailPage() {
    const params = useParams<{ slug: string }>();
    const courseId = params.slug;
    const { publicKey } = useWallet();

    // Data hooks
    const { data: course, isLoading, error } = useCourseDetails(courseId);
    const progress = useCourseProgress(courseId, course?.lessonCount ?? 0);
    const { data: enrollmentStatus } = useEnrollmentStatus(courseId);
    const { enroll, isEnrolling, error: enrollError } = useEnroll(courseId);
    const { finalize, isFinalizing, error: finalizeError } = useCourseFinalization(courseId);

    if (isLoading) {
        return (
            <div className="course-detail-page">
                <nav className="detail-nav">
                    <Link href="/courses" className="back-link">← Courses</Link>
                    <span className="nav-title">Superteam Academy</span>
                </nav>
                <main className="detail-main">
                    <div className="skeleton-header" />
                    <div className="skeleton-layout">
                        <div className="skeleton-content">
                            <div className="skeleton-lesson" />
                            <div className="skeleton-lesson" />
                            <div className="skeleton-lesson" />
                        </div>
                        <div className="skeleton-sidebar" />
                    </div>
                </main>
                <style jsx>{`
                    .course-detail-page { min-height: 100vh; background: #0a0a0f; color: white; }
                    .detail-nav { display: flex; align-items: center; gap: 16px; padding: 16px 32px; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(10,10,15,0.9); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 10; }
                    .back-link { font-size: 0.85rem; color: rgba(255,255,255,0.5); text-decoration: none; }
                    .nav-title { font-size: 1rem; font-weight: 700; background: linear-gradient(135deg, #9945FF, #14F195); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
                    .detail-main { max-width: 1100px; margin: 0 auto; padding: 32px; }
                    .skeleton-header { height: 200px; border-radius: 20px; background: rgba(255,255,255,0.03); margin-bottom: 32px; animation: pulse 1.5s ease infinite; }
                    .skeleton-layout { display: grid; grid-template-columns: 1fr 320px; gap: 32px; }
                    .skeleton-content { display: flex; flex-direction: column; gap: 8px; }
                    .skeleton-lesson { height: 72px; border-radius: 12px; background: rgba(255,255,255,0.03); animation: pulse 1.5s ease infinite; }
                    .skeleton-sidebar { height: 400px; border-radius: 16px; background: rgba(255,255,255,0.03); animation: pulse 1.5s ease infinite; }
                    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                `}</style>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="course-detail-page">
                <nav className="detail-nav">
                    <Link href="/courses" className="back-link">← Courses</Link>
                    <span className="nav-title">Superteam Academy</span>
                </nav>
                <main className="detail-main">
                    <div className="error-state">
                        <h2>Course Not Found</h2>
                        <p>{error?.message ?? 'This course could not be loaded.'}</p>
                        <Link href="/courses" className="error-link">Browse all courses</Link>
                    </div>
                </main>
                <style jsx>{`
                    .course-detail-page { min-height: 100vh; background: #0a0a0f; color: white; }
                    .detail-nav { display: flex; align-items: center; gap: 16px; padding: 16px 32px; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(10,10,15,0.9); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 10; }
                    .back-link { font-size: 0.85rem; color: rgba(255,255,255,0.5); text-decoration: none; }
                    .nav-title { font-size: 1rem; font-weight: 700; background: linear-gradient(135deg, #9945FF, #14F195); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
                    .detail-main { max-width: 1100px; margin: 0 auto; padding: 32px; }
                    .error-state { text-align: center; padding: 80px 20px; }
                    .error-state h2 { font-size: 1.5rem; margin: 0 0 8px; color: rgba(255,255,255,0.8); }
                    .error-state p { color: rgba(255,255,255,0.4); margin: 0 0 24px; }
                    .error-link { color: #9945FF; text-decoration: none; font-weight: 600; }
                `}</style>
            </div>
        );
    }

    const isEnrolled = progress.data?.isEnrolled ?? false;

    return (
        <div className="course-detail-page">
            <nav className="detail-nav">
                <Link href="/courses" className="back-link">← Courses</Link>
                <span className="nav-title">Superteam Academy</span>
            </nav>

            <main className="detail-main">
                <CourseHeader course={course} />

                <div className="detail-layout">
                    <div className="detail-content">
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
                        enrollError={enrollError}
                        finalizeError={finalizeError}
                        onEnroll={() => enroll(undefined)}
                        onFinalize={() => finalize()}
                        walletConnected={!!publicKey}
                    />
                </div>
            </main>

            <style jsx>{`
                .course-detail-page {
                    min-height: 100vh;
                    background: #0a0a0f;
                    color: white;
                }
                .detail-nav {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 32px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    background: rgba(10, 10, 15, 0.9);
                    backdrop-filter: blur(12px);
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                .back-link {
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.5);
                    text-decoration: none;
                    transition: color 0.2s;
                }
                .back-link:hover {
                    color: rgba(255, 255, 255, 0.85);
                }
                .nav-title {
                    font-size: 1rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, #9945FF, #14F195);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .detail-main {
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 32px;
                }
                .detail-layout {
                    display: grid;
                    grid-template-columns: 1fr 320px;
                    gap: 32px;
                    margin-top: 32px;
                    align-items: start;
                }
                @media (max-width: 900px) {
                    .detail-nav {
                        padding: 12px 16px;
                    }
                    .detail-main {
                        padding: 20px 16px;
                    }
                    .detail-layout {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
