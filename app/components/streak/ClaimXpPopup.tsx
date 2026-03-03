/**
 * ClaimXpPopup — Celebration modal shown after claiming daily login XP.
 * Features confetti Lottie animation, XP amount, streak info, and auto-dismiss.
 */
'use client';

import { useEffect, useRef } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { X, Flame, Zap, TrendingUp } from 'lucide-react';

interface ClaimXpPopupProps {
    xpAmount: number;
    streakDay: number;
    onClose: () => void;
}

export function ClaimXpPopup({ xpAmount, streakDay, onClose }: ClaimXpPopupProps) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Auto-dismiss after 5 seconds
    useEffect(() => {
        timerRef.current = setTimeout(onClose, 5000);
        return () => clearTimeout(timerRef.current);
    }, [onClose]);

    // Next day's potential XP
    const nextDayXp = (streakDay + 1) * 10;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

            {/* Confetti — fullscreen behind the card */}
            <div className="absolute inset-0 pointer-events-none">
                <DotLottieReact
                    src="/lotties/Confetti.lottie"
                    autoplay
                    loop={false}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>

            {/* Card */}
            <div
                className="relative z-10 w-[420px] max-w-[90vw] rounded-3xl shadow-2xl text-center animate-in zoom-in-95 duration-300 overflow-hidden"
                style={{ backgroundColor: '#111813' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Top glow accent */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[120px] rounded-full blur-[80px] pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(20,241,149,0.4) 0%, transparent 70%)' }}
                />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full transition-colors z-10"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                    aria-label="Close"
                >
                    <X size={18} />
                </button>

                {/* Content */}
                <div className="px-8 pt-10 pb-8">
                    {/* Animated emoji */}
                    <div className="text-6xl mb-4" style={{ filter: 'drop-shadow(0 4px 12px rgba(20,241,149,0.3))' }}>
                        🎉
                    </div>

                    {/* Heading */}
                    <h2 className="text-2xl font-bold mb-1" style={{ color: '#ffffff' }}>
                        XP Claimed!
                    </h2>
                    <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Day {streakDay} streak bonus earned
                    </p>

                    {/* XP amount — large highlight */}
                    <div
                        className="inline-flex items-center gap-3 rounded-2xl px-8 py-4 mb-6"
                        style={{
                            background: 'linear-gradient(135deg, #14F195 0%, #0acf7f 100%)',
                            boxShadow: '0 8px 32px rgba(20,241,149,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                        }}
                    >
                        <Zap size={24} style={{ color: '#0a1510' }} />
                        <span className="text-3xl font-bold tabular-nums" style={{ color: '#0a1510' }}>
                            +{xpAmount}
                        </span>
                        <span className="text-lg font-semibold" style={{ color: '#0a1510', opacity: 0.7 }}>XP</span>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center justify-center gap-6 mb-6">
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5" style={{ color: '#14F195' }}>
                                <Flame size={16} />
                                <span className="text-lg font-bold tabular-nums">{streakDay}</span>
                            </div>
                            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                Current Streak
                            </span>
                        </div>

                        <div className="w-px h-8" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />

                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5" style={{ color: '#ffd54f' }}>
                                <TrendingUp size={16} />
                                <span className="text-lg font-bold tabular-nums">+{nextDayXp}</span>
                            </div>
                            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                Tomorrow&apos;s XP
                            </span>
                        </div>
                    </div>

                    {/* Motivational text */}
                    <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        🔥 Keep logging in daily to earn more XP!
                    </p>

                    {/* Dismiss button */}
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                        style={{
                            background: 'linear-gradient(135deg, #14F195 0%, #0acf7f 100%)',
                            color: '#0a1510',
                            boxShadow: '0 4px 16px rgba(20,241,149,0.25)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 24px rgba(20,241,149,0.4)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(20,241,149,0.25)')}
                    >
                        Continue
                    </button>
                </div>

                {/* Progress bar showing auto-dismiss */}
                <div className="h-0.5 w-full" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <div
                        className="h-full"
                        style={{
                            backgroundColor: '#14F195',
                            animation: 'shrink 5s linear forwards',
                        }}
                    />
                </div>

                <style jsx>{`
                    @keyframes shrink {
                        from { width: 100%; }
                        to { width: 0%; }
                    }
                `}</style>
            </div>
        </div>
    );
}
