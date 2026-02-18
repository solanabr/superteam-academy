"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useEnrollmentStore } from "@/store/enrollment-store";
import { useUserStore } from "@/store/user-store";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EnrollmentGateProps {
    courseId: string;   // Sanity course _id (used for enrollment lookup)
    courseSlug: string; // URL slug (used for the "go back" link)
    children: React.ReactNode;
}

/**
 * Security gate for lesson pages.
 * - Professors and admins bypass the gate (they can always preview lessons).
 * - Students must be enrolled to see lesson content.
 * - Shows a spinner while enrollment state is loading.
 * - Shows a locked overlay with enroll CTA if not enrolled.
 */
export function EnrollmentGate({ courseId, courseSlug, children }: EnrollmentGateProps) {
    const user = useUserStore((s) => s.user);
    const userLoading = useUserStore((s) => s.isLoading);

    const enrollment = useEnrollmentStore((s) => s.enrollments[courseId]);
    const enrollmentLoading = useEnrollmentStore((s) => s.loading[courseId]);
    const fetchEnrollment = useEnrollmentStore((s) => s.fetchEnrollment);

    const walletAddress = user?.walletAddress;

    // Fetch enrollment when wallet is available
    useEffect(() => {
        if (walletAddress && courseId && enrollment === undefined && !enrollmentLoading) {
            fetchEnrollment(courseId, walletAddress);
        }
    }, [walletAddress, courseId, enrollment, enrollmentLoading, fetchEnrollment]);

    // Professors and admins can always view lessons
    const canBypass = user?.role === "professor" || user?.role === "admin";
    if (canBypass) return <>{children}</>;

    // Still loading auth or enrollment
    const isLoading = userLoading || (walletAddress && enrollment === undefined);
    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-solana" />
                    <span className="text-sm text-text-secondary font-mono">Checking enrollment...</span>
                </div>
            </div>
        );
    }

    // Not authenticated at all
    if (!user) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="glass-panel flex flex-col items-center gap-6 rounded-xl border border-white/10 p-10 text-center max-w-md">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10">
                        <Lock className="h-7 w-7 text-text-muted" />
                    </div>
                    <div>
                        <h2 className="font-display text-xl font-semibold text-text-primary mb-2">Sign in to access this lesson</h2>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            You need to be signed in and enrolled in this course to view lesson content.
                        </p>
                    </div>
                    <Link href="/" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-solana text-white text-sm font-semibold hover:bg-solana/90 transition-colors">
                        Sign in
                    </Link>
                </div>
            </div>
        );
    }

    // Authenticated but not enrolled
    if (!enrollment) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="glass-panel flex flex-col items-center gap-6 rounded-xl border border-white/10 p-10 text-center max-w-md">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10">
                        <Lock className="h-7 w-7 text-text-muted" />
                    </div>
                    <div>
                        <h2 className="font-display text-xl font-semibold text-text-primary mb-2">Enrollment required</h2>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            You need to enroll in this course before you can access its lessons.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <Link
                            href={`/courses/${courseSlug}`}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-solana text-white text-sm font-semibold hover:bg-solana/90 transition-colors"
                        >
                            Enroll now
                        </Link>
                        <Link
                            href="/courses"
                            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-white/10 text-text-secondary text-sm font-medium hover:bg-white/5 transition-colors"
                        >
                            Browse courses
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Enrolled — show lesson content
    return <>{children}</>;
}
