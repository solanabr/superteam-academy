import { Metadata } from "next";
import { OnboardingQuiz } from "@/components/onboarding/onboarding-quiz";

export const metadata: Metadata = {
    title: "Welcome | Superteam Academy",
    description: "Find your perfect Solana learning track.",
};

export default function WelcomePage() {
    return (
        <div className="min-h-screen flex items-center justify-center py-20 px-4 relative overflow-hidden bg-background">
            {/* Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full poite-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="noise-bg opacity-30 pointer-events-none" />

            <div className="z-10 w-full flex flex-col items-center">
                <OnboardingQuiz />
            </div>
        </div>
    );
}
