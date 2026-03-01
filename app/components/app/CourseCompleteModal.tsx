"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Trophy,
    ArrowRight,
    ExternalLink,
    CheckCircle2,
    RotateCcw,
    Loader2,
    Star,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { useIssueCredential } from "@/hooks";
import { cn } from "@/lib/utils";

export interface CourseCompleteModalProps {
    courseId: string;
    courseName: string;
    xpEarned: number;
    /** Credential track collection pubkey. Pass empty string to skip minting. */
    trackCollection: string;
    onClose: () => void;
}

type Phase = "celebrate" | "minting" | "done" | "error";

const EXPLORER_CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER === "mainnet-beta"
    ? ""
    : "?cluster=devnet";

export function CourseCompleteModal({
    courseId,
    courseName,
    xpEarned,
    trackCollection,
    onClose,
}: CourseCompleteModalProps) {
    const router = useRouter();
    const [phase, setPhase] = useState<Phase>("celebrate");
    const [credentialAddress, setCredentialAddress] = useState<string | null>(null);
    const [mintError, setMintError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hasMintedRef = useRef(false);

    const issueCredential = useIssueCredential();

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    // Fire confetti on mount
    useEffect(() => {
        const fire = (particleRatio: number, opts: confetti.Options) => {
            confetti({
                origin: { y: 0.6 },
                ...opts,
                particleCount: Math.floor(200 * particleRatio),
            });
        };
        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    }, []);

    // Auto-advance to minting after 2.5 s
    useEffect(() => {
        if (phase !== "celebrate") return;
        const t = setTimeout(() => setPhase("minting"), 2500);
        return () => clearTimeout(t);
    }, [phase]);

    // Mint when entering minting phase
    useEffect(() => {
        if (phase !== "minting" || hasMintedRef.current) return;
        hasMintedRef.current = true;

        if (!trackCollection) {
            // No collection configured — skip straight to done without an asset
            setPhase("done");
            return;
        }

        issueCredential.mutate(
            {
                courseId,
                learner: "", // useIssueCredential uses connected publicKey internally
                credentialName: `${courseName} Certificate`,
                metadataUri: `https://superteam.academy/api/metadata/${courseId}`,
                trackCollection,
                coursesCompleted: 1,
                totalXp: xpEarned,
            },
            {
                onSuccess: (data) => {
                    setCredentialAddress(data.credentialAsset ?? null);
                    setPhase("done");
                },
                onError: (err: Error) => {
                    setMintError(err.message);
                    setPhase("error");
                },
            }
        );
    }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

    const explorerUrl = credentialAddress
        ? `https://explorer.solana.com/address/${credentialAddress}${EXPLORER_CLUSTER}`
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={phase === "done" || phase === "error" ? onClose : undefined}
            />

            {/* Card */}
            <div className="relative z-10 w-full max-w-md rounded-3xl border-4 border-yellow-400/50 bg-background shadow-2xl overflow-hidden">

                {/* ── CELEBRATE ── */}
                {phase === "celebrate" && (
                    <div className="flex flex-col items-center gap-5 p-7 sm:p-8 text-center">
                        <div className="relative flex items-center justify-center">
                            <div className="absolute h-32 w-32 rounded-full bg-yellow-400/15 blur-2xl" />
                            <div className="text-8xl animate-bounce relative z-10">🏆</div>
                        </div>

                        <div>
                            <h2 className="font-game text-3xl sm:text-4xl text-yellow-400">
                                Course Complete!
                            </h2>
                            <p className="font-game text-muted-foreground mt-2 text-base">
                                You finished <span className="text-foreground font-semibold">{courseName}</span>
                            </p>
                        </div>

                        {/* XP pill */}
                        <div className="inline-flex items-center gap-2 rounded-full border-2 border-yellow-400/40 bg-yellow-400/10 px-6 py-2.5 font-game text-yellow-400 text-lg">
                            <Star className="h-5 w-5 fill-yellow-400" />
                            +{xpEarned.toLocaleString()} XP earned
                        </div>

                        <p className="font-game text-sm text-muted-foreground animate-pulse mt-1">
                            Minting your NFT credential…
                        </p>
                    </div>
                )}

                {/* ── MINTING ── */}
                {phase === "minting" && (
                    <div className="flex flex-col items-center gap-6 p-7 sm:p-8 text-center">
                        <div className="relative flex items-center justify-center h-24 w-24">
                            <div className="absolute inset-0 rounded-full border-4 border-yellow-400/20 border-t-yellow-400 animate-spin" />
                            <span className="text-4xl">🎖️</span>
                        </div>

                        <div>
                            <h2 className="font-game text-2xl text-foreground">
                                Minting Credential NFT
                            </h2>
                            <p className="font-game text-muted-foreground mt-2 text-sm">
                                Your soulbound credential is being written on-chain. This may take a moment…
                            </p>
                        </div>

                        <div className="w-full rounded-xl border border-border bg-muted/30 p-4 font-game text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-yellow-400 shrink-0" />
                                Sending transaction to Solana…
                            </div>
                        </div>
                    </div>
                )}

                {/* ── DONE ── */}
                {phase === "done" && (
                    <div className="flex flex-col items-center gap-5 p-7 sm:p-8 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-green-500 bg-green-500/10">
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                        </div>

                        <div>
                            <h2 className="font-game text-2xl sm:text-3xl">Credential Minted!</h2>
                            <p className="font-game text-muted-foreground mt-1 text-sm">
                                Your NFT credential is permanently on-chain.
                            </p>
                        </div>

                        {credentialAddress && (
                            <div className="w-full rounded-xl border border-border bg-muted/30 p-3 text-left space-y-1">
                                <p className="font-game text-xs text-muted-foreground">Credential address</p>
                                <p className="font-mono text-xs break-all text-foreground">
                                    {credentialAddress}
                                </p>
                                {explorerUrl && (
                                    <a
                                        href={explorerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 font-game text-xs text-yellow-400 hover:underline mt-1"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        View on Explorer
                                    </a>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col w-full gap-2.5 pt-1">
                            {credentialAddress && (
                                <Button
                                    variant="pixel"
                                    size="lg"
                                    className="font-game text-lg w-full"
                                    onClick={() => {
                                        onClose();
                                        router.push(`/certificates/${credentialAddress}`);
                                    }}
                                >
                                    View Certificate
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            )}
                            <Button
                                variant={credentialAddress ? "outline" : "pixel"}
                                size="lg"
                                className="font-game text-lg w-full"
                                onClick={() => {
                                    onClose();
                                    router.push("/courses");
                                }}
                            >
                                Continue Learning
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── ERROR ── */}
                {phase === "error" && (
                    <div className="flex flex-col items-center gap-5 p-7 sm:p-8 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-red-500 bg-red-500/10">
                            <span className="text-4xl">⚠️</span>
                        </div>

                        <div>
                            <h2 className="font-game text-2xl">Minting Failed</h2>
                            <p className="font-game text-muted-foreground mt-2 text-sm leading-relaxed">
                                {mintError ?? "Something went wrong minting your credential."}
                            </p>
                        </div>

                        <div className="flex flex-col w-full gap-2.5">
                            <Button
                                variant="pixel"
                                size="lg"
                                className="font-game text-lg w-full"
                                onClick={() => {
                                    setMintError(null);
                                    hasMintedRef.current = false;
                                    setPhase("minting");
                                }}
                            >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Retry Mint
                            </Button>
                            <Button
                                variant="ghost"
                                size="lg"
                                className="font-game w-full"
                                onClick={() => {
                                    onClose();
                                    router.push("/courses");
                                }}
                            >
                                Skip — Continue Learning
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
