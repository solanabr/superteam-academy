"use client";

import { useRouter } from "next/navigation";
import { OnboardingQuiz } from "@/components/OnboardingQuiz";
import { useLearningService } from "@/contexts/ServicesContext";
import { useWallet } from "@solana/wallet-adapter-react";

export default function OnboardingPage() {
    const router = useRouter();
    const { publicKey } = useWallet();
    const learningService = useLearningService();

    const handleQuizComplete = async (level: string) => {
        if (publicKey) {
            // Save assessment result locally
            if (typeof window !== "undefined") {
                localStorage.setItem(`assessment_${publicKey.toString()}`, level);
            }
        }

        // Redirect to dashboard or home
        router.push("/dashboard");
    };

    return <OnboardingQuiz onComplete={handleQuizComplete} />;
}
