"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, ShieldCheck, Wallet, CheckCircle, XCircle } from "lucide-react";
import { getTransactionFee } from "@/lib/solana-connection";

interface SolanaTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    amount: number; // in SOL
    programId: string;
    transaction: any; // Transaction or VersionedTransaction
    isLoading: boolean;
    error?: string | null;
    success?: boolean;
    successMessage?: string;
    isReclaim?: boolean;
}

export function SolanaTransactionModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    amount,
    programId,
    transaction,
    isLoading,
    error,
    success,
    successMessage,
    isReclaim = false
}: SolanaTransactionModalProps) {
    const [fee, setFee] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen && transaction && !success && !error) {
            getTransactionFee(transaction).then(setFee);
        }
    }, [isOpen, transaction, success, error]);

    // Determine the content based on current state
    const renderContent = () => {
        if (success) {
            return (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 rounded-full bg-solana/10 flex items-center justify-center border border-solana/30 shadow-[0_0_30px_rgba(20,241,149,0.2)]">
                        <CheckCircle className="text-solana" size={48} />
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">Transaction Sent!</h3>
                        <p className="text-sm text-text-muted mt-2 px-6 leading-relaxed">
                            {successMessage || "Your transaction has been broadcast to the Solana network. We are now syncing your progress."}
                        </p>
                    </div>
                    <Button
                        onClick={onClose}
                        className="mt-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8"
                    >
                        Got it
                    </Button>
                </div>
            );
        }

        if (error) {
            const isUserCancelled = error.toLowerCase().includes("cancel") || error.toLowerCase().includes("rejected");
            const isCooldownError = error.includes("0x1778");

            return (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 rounded-full bg-rust/10 flex items-center justify-center border border-rust/30 shadow-[0_0_30px_rgba(255,100,100,0.1)]">
                        <XCircle className="text-rust" size={48} />
                    </div>
                    <div className="text-center px-4">
                        <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">
                            {isUserCancelled ? "Transaction Cancelled" : isCooldownError ? "Reclaim Unavailable" : "Something went wrong"}
                        </h3>
                        <p className="text-sm text-text-muted mt-2">
                            {isUserCancelled
                                ? "No worries! You can try signing the transaction again whenever you're ready."
                                : isCooldownError
                                    ? "Reclaiming is available after course completion or 24h cooldown."
                                    : "We encountered an unexpected error while processing your transaction. Please try again or contact support."}
                        </p>
                        {!isUserCancelled && !isCooldownError && (
                            <div className="mt-4 p-3 bg-rust/5 border border-rust/10 rounded-lg text-[10px] font-mono text-rust/80 break-all max-h-20 overflow-y-auto">
                                ERROR: {error}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 mt-4 w-full px-8">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 border border-white/10 hover:bg-white/5"
                        >
                            Close
                        </Button>
                        {!isUserCancelled && (
                            <Button
                                onClick={onConfirm}
                                className="flex-1 bg-rust hover:bg-rust/80 text-white shadow-[0_0_20px_rgba(255,100,100,0.2)]"
                            >
                                Try Again
                            </Button>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <>
                <DialogHeader className="pt-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-solana/10 rounded-lg border border-solana/20">
                            <ShieldCheck className="text-solana w-6 h-6" />
                        </div>
                        <DialogTitle className="text-xl font-display font-bold tracking-tight">Confirm Transaction</DialogTitle>
                    </div>
                    <DialogDescription className="text-text-muted text-sm text-left">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 my-6">
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-solana/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-solana/10 transition-all duration-500" />
                        <div className="relative">
                            <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-1 font-bold">
                                {isReclaim ? "You Receive" : "You Pay"}
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-display font-bold text-white tracking-tighter">
                                    {amount.toFixed(3)}
                                </span>
                                <span className="text-xl text-solana font-bold italic tracking-wide">SOL</span>
                            </div>
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
                                <Wallet size={12} />
                                <span>Network security deposit (Rent)</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 px-1">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-text-muted">Program</span>
                            <a
                                href={`https://explorer.solana.com/address/${programId}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 font-mono text-solana hover:underline text-xs"
                            >
                                {programId.slice(0, 4)}...{programId.slice(-4)}
                                <ExternalLink size={12} />
                            </a>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-text-muted">Network Fee</span>
                            <span className="font-mono text-xs">
                                {fee ? `${fee.toFixed(6)} SOL` : "Estimating..."}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-text-muted">Network</span>
                            <span className="flex items-center gap-1.5 text-xs uppercase font-bold text-rust">
                                <div className="size-1.5 rounded-full bg-rust animate-pulse" />
                                Devnet
                            </span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-center flex-col sm:flex-row gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 hover:bg-white/5 border border-transparent hover:border-white/10"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 bg-solana hover:bg-solana-dark text-void font-bold shadow-[0_0_20px_rgba(20,241,149,0.3)] transition-all active:scale-95"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin mr-2" size={18} />
                        ) : (
                            <Wallet className="mr-2" size={18} />
                        )}
                        Confirm Transaction
                    </Button>
                </DialogFooter>
            </>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] bg-void/95 backdrop-blur-2xl border-white/10 text-white shadow-2xl overflow-hidden">
                {renderContent()}

                {!success && !error && (
                    <div className="mt-4 pt-4 border-t border-white/5 text-center">
                        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em]">
                            Powered by Superteam Academy
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
