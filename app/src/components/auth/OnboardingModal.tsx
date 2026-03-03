"use client";

import { useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Dialog, DialogPortal, DialogOverlay, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Input } from "../ui/input";
import { useAppUser } from "@/hooks/useAppUser";
import { useUserStore } from "@/store/user-store";
import { useOnboardingStore } from "@/store/onboarding-store";
import { CheckCircle2, ChevronRight, GraduationCap, User, School, Loader2 } from "lucide-react";
import { Link } from "../../../i18n/routing";

interface Question {
    id: string;
    text: string;
    field: string;
    options: { label: string; value: number }[];
}

const ASSESSMENT_QUESTIONS: Question[] = [
    {
        id: "rust",
        text: "How familiar are you with Rust programming?",
        field: "rust",
        options: [
            { label: "Never used it", value: 1 },
            { label: "Basic syntax known", value: 2 },
            { label: "Built small projects", value: 3 },
            { label: "Commercial experience", value: 4 },
        ]
    },
    {
        id: "solana",
        text: "How much experience do you have with Solana development?",
        field: "solana",
        options: [
            { label: "New to Solana", value: 1 },
            { label: "Know the concepts (PDAs, Accounts)", value: 2 },
            { label: "Have deployed to Devnet", value: 3 },
            { label: "Have deployed Mainnet programs", value: 4 },
        ]
    },
    {
        id: "web3",
        text: "How familiar are you with Web3 concepts (Wallets, Signature, DeFi)?",
        field: "web3",
        options: [
            { label: "Brand new", value: 1 },
            { label: "Average crypto user", value: 2 },
            { label: "Intermediate developer", value: 3 },
            { label: "Advanced expert", value: 4 },
        ]
    }
];

interface OnboardingModalProps {
    walletAddress?: string;
    onComplete?: () => void;
}

export function OnboardingModal({ walletAddress, onComplete }: OnboardingModalProps = {}) {
    const { user } = useAppUser();
    const fetchUser = useUserStore((s) => s.fetchUser);

    const {
        isOpen, setIsOpen,
        step, setStep,
        currentQuestion, setCurrentQuestion,
        answers, setAnswer,
        username, setUsername,
        roleSelection, setRoleSelection,
        isSaving, setIsSaving
    } = useOnboardingStore();

    useEffect(() => {
        // AuthGuard controls whether this component mounts based on user.profile.onboardingComplete.
        // Therefore, if it mounts, we know we should show the modal.
        setIsOpen(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleNext = async () => {
        if (step === 0) setStep(1);
        else if (step === 1) {
            if (!username.trim() || isSaving) return;
            // Proceed without saving to prevent AuthGuard from unmounting the modal
            setStep(2);
        }
    };

    const handleAnswer = async (value: number) => {
        if (isSaving) return;

        const q = ASSESSMENT_QUESTIONS[currentQuestion];
        setAnswer(q.field, value);

        // Use the new Answers that includes the current value
        const newAnswers = { ...answers, [q.field]: value };

        if (currentQuestion < ASSESSMENT_QUESTIONS.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            setIsSaving(true);
            const targetWallet = walletAddress || user?.walletAddress;
            if (targetWallet) {
                try {
                    await fetch("/api/user", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            wallet: targetWallet,
                            role: roleSelection,
                            profile: {
                                displayName: username || "Student",
                                onboardingComplete: true
                            },
                            preferences: newAnswers
                        })
                    });
                } catch (e) {
                    console.error("Failed to save profile:", e);
                }
            }
            setIsSaving(false);
            setStep(3);
        }
    };

    const finishOnboarding = () => {
        setIsOpen(false);
        if (onComplete) onComplete();
        const targetWallet = walletAddress || user?.walletAddress;
        if (targetWallet) {
            fetchUser(targetWallet);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => { if (!open && step === 3) finishOnboarding(); }}>
            <DialogPortal>
                {/* Custom Image Overlay for Onboarding */}
                <DialogOverlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-500">
                    <div
                        className="absolute inset-0 bg-cover bg-center z-0"
                        style={{ backgroundImage: "url('/logo/capa-nova1.jpg')" }}
                    />
                    {/* Glassy dark blur overlay to ensure content readability */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-[1]" />
                </DialogOverlay>

                <DialogPrimitive.Content
                    className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[500px] translate-x-[-50%] translate-y-[-50%] gap-4 border border-white/10 bg-black/40 backdrop-blur-2xl p-0 shadow-2xl sm:rounded-2xl overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[50%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[50%] duration-500"
                    onInteractOutside={(e) => { if (step !== 3) e.preventDefault(); }}
                    onEscapeKeyDown={(e) => { if (step !== 3) e.preventDefault(); }}
                >
                    <div className="p-8 relative z-20">
                        {step === 0 && (
                            <div className="space-y-6 text-center py-4">
                                <div className="mx-auto w-16 h-16 rounded-full bg-solana/10 flex items-center justify-center border border-solana/20">
                                    <GraduationCap className="w-8 h-8 text-solana" />
                                </div>
                                <div className="flex flex-col space-y-1.5 text-center">
                                    <DialogTitle className="text-2xl font-display font-bold text-white text-center">Welcome to Academy</DialogTitle>
                                </div>
                                <p className="text-text-secondary leading-relaxed">
                                    Take a quick skill assessment to personalize your learning journey and get course recommendations.
                                </p>
                                <Button type="button" onClick={handleNext} className="w-full bg-solana text-black font-bold hover:bg-solana/90">
                                    Get Started
                                    <ChevronRight className="ml-2 w-4 h-4" />
                                </Button>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-display font-bold text-white">Create Your Profile</h3>
                                    <p className="text-text-muted text-sm">How should we address you in the Academy?</p>
                                </div>

                                <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-mono text-text-muted uppercase tracking-wider">Username</label>
                                        <Input
                                            placeholder="Enter your name or handle"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="bg-white/5 border-white/10 text-white h-12"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-mono text-text-muted uppercase tracking-wider">Select Your Path</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setRoleSelection("student")}
                                                className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${roleSelection === "student"
                                                    ? "bg-solana/10 border-solana text-solana shadow-[0_0_15px_rgba(20,241,149,0.1)]"
                                                    : "bg-white/5 border-white/10 text-text-muted hover:border-white/20"
                                                    }`}
                                            >
                                                <User className="w-6 h-6" />
                                                <span className="text-sm font-bold">Student</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRoleSelection("professor")}
                                                className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${roleSelection === "professor"
                                                    ? "bg-solana/10 border-solana text-solana shadow-[0_0_15px_rgba(20,241,149,0.1)]"
                                                    : "bg-white/5 border-white/10 text-text-muted hover:border-white/20"
                                                    }`}
                                            >
                                                <School className="w-6 h-6" />
                                                <span className="text-sm font-bold">Professor</span>
                                            </button>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={!username.trim() || isSaving}
                                        className="w-full bg-solana text-black font-bold hover:bg-solana/90 h-12"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                Continue to Assessment
                                                <ChevronRight className="ml-2 w-4 h-4" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-8 py-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-mono text-text-muted uppercase tracking-wider">
                                        <span>Question {currentQuestion + 1} of {ASSESSMENT_QUESTIONS.length}</span>
                                        <span>{Math.round(((currentQuestion + 1) / ASSESSMENT_QUESTIONS.length) * 100)}%</span>
                                    </div>
                                    <Progress value={((currentQuestion + 1) / ASSESSMENT_QUESTIONS.length) * 100} className="h-1 bg-white/5" />
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-lg font-medium text-white">
                                        {ASSESSMENT_QUESTIONS[currentQuestion].text}
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        {ASSESSMENT_QUESTIONS[currentQuestion].options.map((opt) => (
                                            <button
                                                key={opt.value}
                                                disabled={isSaving}
                                                onClick={() => handleAnswer(opt.value)}
                                                className="group p-4 bg-white/5 border border-white/5 rounded-xl text-left hover:border-solana/50 hover:bg-solana/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span className="text-sm font-medium text-white group-hover:text-solana transition-colors">
                                                    {opt.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-8 py-4 text-center">
                                <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-display font-bold text-white">Profile Complete!</h3>
                                    <p className="text-text-secondary text-sm">Browse courses based on your skill preference.</p>
                                </div>

                                <Button
                                    onClick={finishOnboarding}
                                    className="w-full bg-solana text-black font-bold flex-col sm:flex-row hover:bg-solana/90 min-h-12 h-auto text-xs sm:text-sm py-3"
                                >
                                    Continue to dashboard and browse recommended course
                                    <ChevronRight className="ml-2 w-4 h-4 shrink-0 hidden sm:block" />
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogPrimitive.Content>
            </DialogPortal>
        </Dialog>
    );
}
