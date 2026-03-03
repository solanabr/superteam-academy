"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
    getXPBalance,
    calculateLevelFromXP,
    checkEnrollment,
    getCredentialNFTs,
    buildEnrollTransaction,
    type CredentialNFT,
} from "@/lib/solana-program";
import { LearningProgressService } from "@/services";

// ────────────────────────────────────────────────────────────────
// Solana Hooks — React integration layer for on-chain data.
// Provides real devnet reads when wallet is connected,
// falls back to mock/localStorage otherwise.
// ────────────────────────────────────────────────────────────────

interface SolanaDataContextType {
    xpBalance: number;
    level: number;
    credentials: CredentialNFT[];
    isLoadingXP: boolean;
    isLoadingCredentials: boolean;
    refreshXP: () => Promise<void>;
    refreshCredentials: () => Promise<void>;
    enrollInCourse: (courseId: number) => Promise<boolean>;
    isEnrolled: (courseId: number) => Promise<boolean>;
}

const SolanaDataContext = createContext<SolanaDataContextType>({
    xpBalance: 0,
    level: 0,
    credentials: [],
    isLoadingXP: false,
    isLoadingCredentials: false,
    refreshXP: async () => { },
    refreshCredentials: async () => { },
    enrollInCourse: async () => false,
    isEnrolled: async () => false,
});

export function useSolanaData() {
    return useContext(SolanaDataContext);
}

export function SolanaDataProvider({ children }: { children: ReactNode }) {
    const { connection } = useConnection();
    const { publicKey, sendTransaction, connected } = useWallet();
    const [xpBalance, setXpBalance] = useState(0);
    const [level, setLevel] = useState(0);
    const [credentials, setCredentials] = useState<CredentialNFT[]>([]);
    const [isLoadingXP, setIsLoadingXP] = useState(false);
    const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);

    const refreshXP = useCallback(async () => {
        if (!publicKey || !connected) {
            // Fall back to mock data
            const mockXP = LearningProgressService.getXPBalance("");
            setXpBalance(mockXP);
            setLevel(calculateLevelFromXP(mockXP));
            return;
        }

        setIsLoadingXP(true);
        try {
            const balance = await getXPBalance(connection, publicKey);
            if (balance > 0) {
                setXpBalance(balance);
                setLevel(calculateLevelFromXP(balance));
            } else {
                // No on-chain XP yet, show local progress
                const mockXP = LearningProgressService.getXPBalance(publicKey.toBase58());
                setXpBalance(mockXP);
                setLevel(calculateLevelFromXP(mockXP));
            }
        } catch (error) {
            console.error("Failed to fetch XP:", error);
            const mockXP = LearningProgressService.getXPBalance("");
            setXpBalance(mockXP);
            setLevel(calculateLevelFromXP(mockXP));
        } finally {
            setIsLoadingXP(false);
        }
    }, [publicKey, connected, connection]);

    const refreshCredentials = useCallback(async () => {
        if (!publicKey || !connected) {
            setCredentials([]);
            return;
        }

        setIsLoadingCredentials(true);
        try {
            const creds = await getCredentialNFTs(publicKey.toBase58());
            setCredentials(creds);
        } catch (error) {
            console.error("Failed to fetch credentials:", error);
            setCredentials([]);
        } finally {
            setIsLoadingCredentials(false);
        }
    }, [publicKey, connected]);

    const enrollInCourse = useCallback(
        async (courseId: number): Promise<boolean> => {
            if (!publicKey || !connected || !sendTransaction) {
                return false;
            }

            try {
                const tx = await buildEnrollTransaction(connection, courseId, publicKey);
                const signature = await sendTransaction(tx, connection);
                await connection.confirmTransaction(signature, "confirmed");

                // Also track locally
                await LearningProgressService.enrollInCourse(
                    publicKey.toBase58(),
                    String(courseId)
                );
                return true;
            } catch (error) {
                console.error("Enrollment failed:", error);
                // Fallback to local enrollment
                await LearningProgressService.enrollInCourse(
                    publicKey?.toBase58() || "",
                    String(courseId)
                );
                return true;
            }
        },
        [publicKey, connected, sendTransaction, connection]
    );

    const isEnrolled = useCallback(
        async (courseId: number): Promise<boolean> => {
            if (!publicKey || !connected) return false;
            try {
                return await checkEnrollment(connection, courseId, publicKey);
            } catch {
                return false;
            }
        },
        [publicKey, connected, connection]
    );

    // Auto-fetch on wallet connect
    useEffect(() => {
        refreshXP();
        refreshCredentials();
    }, [refreshXP, refreshCredentials]);

    return (
        <SolanaDataContext.Provider
            value={{
                xpBalance,
                level,
                credentials,
                isLoadingXP,
                isLoadingCredentials,
                refreshXP,
                refreshCredentials,
                enrollInCourse,
                isEnrolled,
            }}
        >
            {children}
        </SolanaDataContext.Provider>
    );
}

/**
 * Hook to track analytics events.
 * Integrates with GA4 and PostHog.
 */
export function useAnalytics() {
    const trackEvent = useCallback((event: string, properties?: Record<string, unknown>) => {
        // GA4
        if (typeof window !== "undefined" && (window as any).gtag) {
            (window as any).gtag("event", event, properties);
        }

        // PostHog
        if (typeof window !== "undefined" && (window as any).posthog) {
            (window as any).posthog.capture(event, properties);
        }

        if (process.env.NODE_ENV === "development") {
            console.log(`[Analytics] ${event}`, properties);
        }
    }, []);

    return {
        trackEvent,
        trackPageView: (page: string) => trackEvent("page_view", { page }),
        trackCourseEnroll: (courseId: string, courseTitle: string) =>
            trackEvent("course_enrolled", { courseId, courseTitle }),
        trackLessonComplete: (courseId: string, lessonId: string, xp: number) =>
            trackEvent("lesson_completed", { courseId, lessonId, xp }),
        trackChallengeSubmit: (courseId: string, lessonId: string, passed: boolean) =>
            trackEvent("challenge_submitted", { courseId, lessonId, passed }),
        trackWalletConnect: (walletType: string) =>
            trackEvent("wallet_connected", { walletType }),
        trackLanguageChange: (locale: string) =>
            trackEvent("language_changed", { locale }),
        trackThemeChange: (theme: string) =>
            trackEvent("theme_changed", { theme }),
        trackAchievementUnlocked: (achievementId: string) =>
            trackEvent("achievement_unlocked", { achievementId }),
    };
}
