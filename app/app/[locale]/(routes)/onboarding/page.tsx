'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { goeyToast } from 'goey-toast';

import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { ProfileForm } from '@/components/onboarding/ProfileForm';
import { WalletLinkStep } from '@/components/onboarding/WalletLinkStep';

type Step = 'profile' | 'wallet-link';

/**
 * Onboarding page — multi-step wizard.
 *
 * Auth enforcement is handled server-side by proxy.ts:
 *   - Unauthenticated/invalid users → redirected to /login (never reach this page)
 *   - Already-onboarded users → redirected to /dashboard (never reach this page)
 *   - Only non-onboarded authenticated users see this page
 *
 * All users are assigned the 'student' role automatically.
 */
export default function OnboardingPage() {
    const { data: session } = useSession();
    const t = useTranslations('onboarding');
    const [step, setStep] = useState<Step>('profile');
    const [submitting, setSubmitting] = useState(false);

    // Determine if user signed up via wallet (no wallet-link step needed)
    const s = session as Record<string, unknown> | null;
    const hasWalletAddress = !!(s?.walletAddress);
    const linkedAccounts = (s?.linkedAccounts as { provider: string }[] | undefined) || [];
    const hasWalletLinked = linkedAccounts.some((a) => a.provider === 'wallet');
    const isWalletUser = hasWalletAddress || hasWalletLinked;

    // Calculate total steps and current index
    const steps: Step[] = isWalletUser ? ['profile'] : ['profile', 'wallet-link'];
    const currentIndex = steps.indexOf(step);

    const handleProfileSubmit = async (data: { name: string; username: string; avatar_url: string }) => {
        setSubmitting(true);

        try {
            // Save role as student (atomic — sets onboarding_complete = true)
            const roleRes = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'student' }),
            });

            if (!roleRes.ok) {
                const roleData = await roleRes.json();
                if (roleRes.status === 403) {
                    goeyToast.warning('Role already set');
                    window.location.href = '/api/auth/session/refresh?redirect=/dashboard';
                    return;
                }
                throw new Error(roleData.error || 'Failed to save role');
            }

            // Save profile data
            const profileRes = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!profileRes.ok) {
                const profileData = await profileRes.json();
                throw new Error(profileData.error || 'Failed to save profile');
            }

            goeyToast.success(t('profileCreated') || 'Profile created successfully!');

            if (isWalletUser) {
                sessionStorage.setItem('auth_success', '1');
                window.location.href = '/api/auth/session/refresh?redirect=/dashboard';
            } else {
                setStep('wallet-link');
                setSubmitting(false);
            }
        } catch (err) {
            goeyToast.error(err instanceof Error ? err.message : 'Something went wrong');
            setSubmitting(false);
        }
    };

    const handleWalletLinked = () => {
        goeyToast.success('Wallet linked! Redirecting to dashboard...');
        sessionStorage.setItem('auth_success', '1');
        window.location.href = '/api/auth/session/refresh?redirect=/dashboard';
    };

    const handleWalletSkip = () => {
        goeyToast.info('You can link a wallet later from profile settings.');
        sessionStorage.setItem('auth_success', '1');
        window.location.href = '/api/auth/session/refresh?redirect=/dashboard';
    };

    return (
        <OnboardingLayout currentStep={currentIndex} totalSteps={steps.length}>
            {step === 'profile' && (
                <ProfileForm onSubmit={handleProfileSubmit} isSubmitting={submitting} />
            )}

            {step === 'wallet-link' && (
                <>
                    <button
                        onClick={() => setStep('profile')}
                        className="flex items-center gap-1.5 font-supreme text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <WalletLinkStep
                        onComplete={handleWalletLinked}
                        onSkip={handleWalletSkip}
                        isSubmitting={submitting}
                    />
                </>
            )}
        </OnboardingLayout>
    );
}
