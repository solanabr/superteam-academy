"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { OnboardingQuiz } from "@/components/OnboardingQuiz";
import { useLearningService } from "@/contexts/ServicesContext";
import { useWallet } from "@solana/wallet-adapter-react";

import { useSearchParams } from "next/navigation";

export default function OnboardingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { publicKey } = useWallet();
    const learningService = useLearningService();

    const handleQuizComplete = async (level: string) => {
        if (typeof window !== "undefined") {
            const assessmentKey = publicKey ? `assessment_${publicKey.toString()}` : 'assessment_guest';
            localStorage.setItem(assessmentKey, level);
        }

        // Get redirect path from query or default to dashboard
        const redirect = searchParams.get("redirect") || "/dashboard";
        router.push(redirect);
    };

    return (
        <React.Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>}>
            <OnboardingQuiz onComplete={handleQuizComplete} />
        </React.Suspense>
    );
}
