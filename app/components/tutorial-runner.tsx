"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { CallBackProps, STATUS } from "react-joyride";
import { tutorialSteps } from "@/lib/tutorials";
import { useAuth } from "@/components/providers/auth-provider";

// Dynamic import to avoid SSR issues with Joyride
const Joyride = dynamic(() => import("react-joyride"), { ssr: false });

const STORAGE_PREFIX = "superteam_tutorial_seen_";

/**
 * Renders a Joyride tutorial for a specific page.
 * Automatically shows on first visit, never again.
 * Props:
 *  - pageKey: key from tutorialSteps (e.g., "dashboard", "courseDetail")
 */
export function TutorialRunner({ pageKey }: { pageKey: string }) {
    const { isAuthenticated, user } = useAuth();
    const [run, setRun] = useState(false);
    const [mounted, setMounted] = useState(false);

    const steps = tutorialSteps[pageKey];

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        // Don't show tutorial until user is fully onboarded
        if (!mounted || !isAuthenticated || !user?.isOnboarded || !steps?.length) return;

        const storageKey = `${STORAGE_PREFIX}${pageKey}`;
        const seen = typeof window !== "undefined" && localStorage.getItem(storageKey);

        if (!seen) {
            // Delay to let page render and data-tutorial targets mount
            const timer = setTimeout(() => setRun(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [mounted, isAuthenticated, user?.isOnboarded, pageKey, steps]);

    const handleCallback = useCallback(
        (data: CallBackProps) => {
            const { status } = data;
            const finishedStatuses = ["finished", "skipped"];

            if (finishedStatuses.includes(status as string)) {
                setRun(false);
                if (typeof window !== "undefined") {
                    localStorage.setItem(`${STORAGE_PREFIX}${pageKey}`, "true");
                }
            }
        },
        [pageKey]
    );

    if (!mounted || !steps?.length) return null;

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showSkipButton
            showProgress
            callback={handleCallback}
            styles={{
                options: {
                    primaryColor: "hsl(var(--solana-purple, 264 100% 63%))",
                    zIndex: 10000,
                    arrowColor: "hsl(var(--card, 0 0% 100%))",
                    backgroundColor: "hsl(var(--card, 0 0% 100%))",
                    textColor: "hsl(var(--foreground, 0 0% 0%))",
                    overlayColor: "rgba(0, 0, 0, 0.5)",
                },
                tooltip: {
                    borderRadius: "16px",
                    padding: "20px",
                    fontSize: "14px",
                },
                tooltipContainer: {
                    textAlign: "left",
                },
                buttonNext: {
                    borderRadius: "9999px",
                    padding: "8px 20px",
                    fontSize: "13px",
                    fontWeight: 600,
                },
                buttonBack: {
                    borderRadius: "9999px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    color: "hsl(var(--muted-foreground, 0 0% 40%))",
                },
                buttonSkip: {
                    fontSize: "12px",
                    color: "hsl(var(--muted-foreground, 0 0% 40%))",
                },
                spotlight: {
                    borderRadius: "12px",
                },
            }}
            locale={{
                back: "Back",
                close: "Got it",
                last: "Done!",
                next: "Next",
                skip: "Skip tour",
            }}
        />
    );
}
