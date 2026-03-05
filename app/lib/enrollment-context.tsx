"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { progressService } from "./services/local-progress.service";
import { useWallet } from "@solana/wallet-adapter-react";

interface EnrollmentState {
    enrolledCourseIds: string[];
    activeCourseId: string | null;
    enrollInCourse: (courseId: string) => void;
    unenrollFromCourse: (courseId: string) => void;
    setActiveCourse: (courseId: string | null) => void;
    isEnrolled: (courseId: string) => boolean;
}

const EnrollmentContext = createContext<EnrollmentState | null>(null);

const STORAGE_KEY = "superteam_enrolled_courses";
const ACTIVE_KEY = "superteam_active_course";

export function EnrollmentProvider({ children }: { children: ReactNode }) {
    const { publicKey } = useWallet();
    const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
    const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
    const [hydrated, setHydrated] = useState(false);

    // Hydrate from progressService (On-Chain/Mock)
    useEffect(() => {
        const walletId = publicKey ? publicKey.toString() : "guest";

        progressService.getEnrolledCourses(walletId)
            .then(courses => {
                setEnrolledCourseIds(courses);
                const active = localStorage.getItem(ACTIVE_KEY);
                if (active && courses.includes(active)) {
                    setActiveCourseId(active);
                } else if (courses.length > 0) {
                    setActiveCourseId(courses[0]);
                }
            })
            .catch(console.error)
            .finally(() => setHydrated(true));
    }, [publicKey]);

    // Persist Active Course (UI configuration only, not on-chain state)
    useEffect(() => {
        if (!hydrated) return;
        if (activeCourseId) {
            localStorage.setItem(ACTIVE_KEY, activeCourseId);
        } else {
            localStorage.removeItem(ACTIVE_KEY);
        }
    }, [activeCourseId, hydrated]);

    const enrollInCourse = useCallback((courseId: string) => {
        setEnrolledCourseIds((prev) => {
            if (prev.includes(courseId)) return prev;
            return [...prev, courseId];
        });
        setActiveCourseId(courseId);

        // Also notify the service layer (which will sign the tx on-chain later)
        const walletId = publicKey ? publicKey.toString() : "guest";
        progressService.enroll(courseId, walletId).catch(console.error);
    }, [publicKey]);

    const unenrollFromCourse = useCallback((courseId: string) => {
        // Technically this involves Anchor tx close_enrollment to reclaim rent
        // which isn't defined on our generic interface yet, but we'll reflect it in UI
        setEnrolledCourseIds((prev) => prev.filter((id) => id !== courseId));
        setActiveCourseId((prev) => (prev === courseId ? null : prev));
        // TODO: Call progressService.closeEnrollment() when implemented
    }, []);

    const setActiveCourse = useCallback((courseId: string | null) => {
        setActiveCourseId(courseId);
    }, []);

    const isEnrolled = useCallback(
        (courseId: string) => enrolledCourseIds.includes(courseId),
        [enrolledCourseIds]
    );

    return (
        <EnrollmentContext.Provider
            value={{
                enrolledCourseIds,
                activeCourseId,
                enrollInCourse,
                unenrollFromCourse,
                setActiveCourse,
                isEnrolled,
            }}
        >
            {children}
        </EnrollmentContext.Provider>
    );
}

export function useEnrollment() {
    const ctx = useContext(EnrollmentContext);
    if (!ctx) throw new Error("useEnrollment must be used within EnrollmentProvider");
    return ctx;
}
