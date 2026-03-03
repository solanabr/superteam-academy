'use client';

import { useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { LandingNavbar } from '@/components/landing/LandingNavbar';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface OnboardingLayoutProps {
    currentStep: number;
    totalSteps: number;
    children: ReactNode;
}

export function OnboardingLayout({ currentStep, totalSteps, children }: OnboardingLayoutProps) {
    const [lottieData, setLottieData] = useState<object | null>(null);

    useEffect(() => {
        fetch('/lotties/hello_lottie.json')
            .then((r) => r.json())
            .then(setLottieData)
            .catch(() => { /* decorative — fail silently */ });
    }, []);

    return (
        <>
            <LandingNavbar minimal />

            <div className="fixed inset-0 top-16 flex">
                {/* Left panel — onboarding flow (scrollable) */}
                <div className="w-full lg:w-1/2 h-full overflow-y-auto bg-brand-cream dark:bg-brand-black px-8 sm:px-14 lg:px-16 flex items-center justify-center" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="w-full max-w-xl py-10">
                        {children}
                    </div>
                </div>

                {/* Right panel — persistent Lottie (fixed full height) */}
                <div className="hidden lg:flex w-1/2 h-full items-center justify-center bg-brand-green/5 dark:bg-[#0f2618] border-l border-border">
                    <div className="w-full max-w-[44rem] aspect-square">
                        {lottieData && (
                            <Lottie
                                animationData={lottieData}
                                loop
                                autoplay
                                style={{ width: '100%', height: '100%' }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
