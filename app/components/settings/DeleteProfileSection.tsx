'use client';

/**
 * Delete Profile Section — danger zone with type-to-confirm and 10-second countdown.
 * Hard-deletes all user data via DELETE /api/profile when timer expires.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { goeyToast } from 'goey-toast';

const COUNTDOWN_SECONDS = 10;

export function DeleteProfileSection() {
    const [confirmText, setConfirmText] = useState('');
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
    const [isDeleting, setIsDeleting] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const isConfirmed = confirmText === 'DELETE';

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const startCountdown = useCallback(() => {
        setIsCountingDown(true);
        setSecondsLeft(COUNTDOWN_SECONDS);

        intervalRef.current = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    // Trigger deletion
                    performDelete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const cancelCountdown = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsCountingDown(false);
        setSecondsLeft(COUNTDOWN_SECONDS);
        setConfirmText('');
        goeyToast.success('Deletion cancelled');
    }, []);

    const performDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch('/api/profile', { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete');
            }
            goeyToast.success('Account deleted. Goodbye!');
            // Sign out and redirect to home
            setTimeout(() => signOut({ callbackUrl: '/' }), 1000);
        } catch (err) {
            console.error('Delete failed:', err);
            goeyToast.error(err instanceof Error ? err.message : 'Failed to delete account');
            // Reset state on failure
            setIsCountingDown(false);
            setSecondsLeft(COUNTDOWN_SECONDS);
            setConfirmText('');
            setIsDeleting(false);
        }
    };

    // SVG circle progress for countdown
    const circumference = 2 * Math.PI * 18;
    const dashOffset = circumference * (secondsLeft / COUNTDOWN_SECONDS);

    return (
        <div className="rounded-xl border-2 border-red-500/30 bg-red-500/5 p-5">
            <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
                </div>
                <div>
                    <h4 className="text-sm font-bold font-supreme text-red-600 dark:text-red-400">
                        Delete Account
                    </h4>
                    <p className="text-xs text-red-500/70 font-supreme mt-0.5">
                        This action is permanent and cannot be undone. All your data including streaks, achievements, credentials, and community posts will be permanently deleted.
                    </p>
                </div>
            </div>

            {isCountingDown ? (
                <div className="flex flex-col items-center gap-4 py-4">
                    {/* Countdown ring */}
                    <div className="relative w-20 h-20">
                        <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
                            <circle
                                cx="20" cy="20" r="18"
                                fill="none"
                                stroke="currentColor"
                                className="text-red-500/10"
                                strokeWidth="3"
                            />
                            <circle
                                cx="20" cy="20" r="18"
                                fill="none"
                                stroke="currentColor"
                                className="text-red-500"
                                strokeWidth="3"
                                strokeDasharray={circumference}
                                strokeDashoffset={circumference - dashOffset}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 1s linear' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold font-array text-red-500">
                                {secondsLeft}
                            </span>
                        </div>
                    </div>

                    <p className="text-sm font-supreme text-red-500/80 text-center">
                        {isDeleting
                            ? 'Deleting your account...'
                            : `Your account will be deleted in ${secondsLeft} seconds`}
                    </p>

                    {!isDeleting && (
                        <button
                            onClick={cancelCountdown}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm font-semibold font-supreme hover:bg-muted/80 transition-all"
                        >
                            <X className="w-4 h-4" />
                            Cancel Deletion
                        </button>
                    )}

                    {isDeleting && (
                        <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                    )}
                </div>
            ) : (
                <>
                    <div className="mb-3">
                        <label className="text-xs font-semibold font-supreme text-foreground mb-1.5 block">
                            Type <span className="text-red-500 font-bold">DELETE</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Type DELETE here"
                            maxLength={6}
                            className="w-full max-w-[280px] px-3.5 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm font-supreme outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 transition-all placeholder:text-muted-foreground/50"
                            autoComplete="off"
                            spellCheck={false}
                        />
                    </div>
                    <button
                        onClick={startCountdown}
                        disabled={!isConfirmed}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold font-supreme shadow-sm hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete My Account
                    </button>
                </>
            )}
        </div>
    );
}
