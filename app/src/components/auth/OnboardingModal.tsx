"use client";

import { useState } from "react";
import { useUserStore } from "@/store/user-store";

type OnboardingModalProps = {
    walletAddress: string;
    onComplete: () => void;
};

const ROLES = [
    {
        id: "student" as const,
        label: "Student",
        icon: "school",
        description: "I'm here to learn Solana development",
        color: "from-solana to-emerald-600",
    },
    {
        id: "professor" as const,
        label: "Teacher",
        icon: "psychology",
        description: "I want to create and publish courses",
        color: "from-blue-500 to-indigo-600",
    },
];

/**
 * One-time onboarding modal shown after first Privy signup.
 * Collects role + display name, PUTs to /api/user, sets profile.onboardingComplete = true.
 */
export function OnboardingModal({ walletAddress, onComplete }: OnboardingModalProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedRole, setSelectedRole] = useState<"student" | "professor" | null>(null);
    const [displayName, setDisplayName] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = useUserStore((s) => s.fetchUser);

    const handleSubmit = async () => {
        if (!selectedRole || !displayName.trim()) return;

        setSaving(true);
        setError(null);

        try {
            const res = await fetch("/api/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet: walletAddress,
                    role: selectedRole,
                    profile: {
                        displayName: displayName.trim(),
                        onboardingComplete: true,
                    },
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to save profile");
            }

            // Refresh user in store so AuthGuard sees onboardingComplete
            await fetchUser(walletAddress);
            onComplete();
        } catch (e: any) {
            setError(e?.message ?? "Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/95 backdrop-blur-md">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-solana/10 to-rust/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-lg mx-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-solana/10 border border-solana/20 mb-4">
                        <span className="w-2 h-2 rounded-full bg-solana animate-pulse" />
                        <span className="font-code text-xs text-solana uppercase tracking-widest">Welcome</span>
                    </div>
                    <h1 className="font-display text-3xl font-bold text-white mb-2">
                        {step === 1 ? "Choose your path" : "What should we call you?"}
                    </h1>
                    <p className="text-text-muted text-sm">
                        {step === 1
                            ? "Select your role to personalize your experience."
                            : "Pick a name that other developers will see."}
                    </p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className={`h-1 w-12 rounded-full transition-colors ${step >= 1 ? "bg-solana" : "bg-white/10"}`} />
                    <div className={`h-1 w-12 rounded-full transition-colors ${step >= 2 ? "bg-solana" : "bg-white/10"}`} />
                </div>

                {/* Step 1: Role Selection */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {ROLES.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRole(role.id)}
                                    className={`relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-300 group ${selectedRole === role.id
                                        ? "border-solana bg-solana/10 shadow-[0_0_30px_rgba(20,241,149,0.15)]"
                                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5"
                                        }`}
                                >
                                    <div className={`size-14 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${selectedRole === role.id ? "scale-110" : ""
                                        }`}>
                                        <span className="material-symbols-outlined text-white text-2xl">{role.icon}</span>
                                    </div>
                                    <div className="text-center">
                                        <h3 className={`font-display font-bold text-lg ${selectedRole === role.id ? "text-solana" : "text-white"}`}>
                                            {role.label}
                                        </h3>
                                        <p className="text-text-muted text-xs mt-1">{role.description}</p>
                                    </div>
                                    {selectedRole === role.id && (
                                        <div className="absolute top-3 right-3 size-6 bg-solana rounded-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-sm text-void">check</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => selectedRole && setStep(2)}
                            disabled={!selectedRole}
                            className="w-full mt-6 h-12 rounded-xl font-display font-bold text-sm bg-solana text-[#0A0A0B] hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_-5px_rgba(20,240,148,0.4)] disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Continue
                        </button>
                    </div>
                )}

                {/* Step 2: Display Name */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Developer / Pseudo Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="e.g. vitalik, satoshi, solana_dev"
                                maxLength={30}
                                autoFocus
                                className="w-full h-12 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-white font-mono text-sm placeholder:text-text-muted focus:outline-none focus:border-solana/50 focus:ring-1 focus:ring-solana/20 transition-all"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && displayName.trim()) handleSubmit();
                                }}
                            />
                            <p className="text-[11px] text-text-muted font-mono">
                                {displayName.length}/30 characters
                            </p>
                        </div>

                        {error && (
                            <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(1)}
                                className="h-12 px-6 rounded-xl font-medium text-sm text-text-secondary hover:text-white hover:bg-white/5 border border-white/10 transition-all"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!displayName.trim() || saving}
                                className="flex-1 h-12 rounded-xl font-display font-bold text-sm bg-solana text-[#0A0A0B] hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_-5px_rgba(20,240,148,0.4)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="size-4 rounded-full border-2 border-void/30 border-t-void animate-spin" />
                                        Setting up...
                                    </>
                                ) : (
                                    <>
                                        Let&apos;s Go
                                        <span className="material-symbols-outlined text-lg">rocket_launch</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
