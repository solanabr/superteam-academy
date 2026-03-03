'use client';

import { useState, useEffect } from 'react';
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
    const t = useTranslations('onboarding');
    const [step, setStep] = useState<Step>('profile');
    const [submitting, setSubmitting] = useState(false);

    // Authoritative wallet-user check from the DB via /api/auth/linked-accounts.
    // Session-based checks (useSession → provider/walletAddress/linkedAccounts)
    // are unreliable with NextAuth v4's CredentialsProvider, so we query the
    // database-backed endpoint instead. `null` means still loading.
    const [isWalletUser, setIsWalletUser] = useState<boolean | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch('/api/auth/linked-accounts')
            .then((r) => r.json())
            .then((data) => {
                if (!cancelled) setIsWalletUser(!!data.hasWallet);
            })
            .catch(() => {
                if (!cancelled) setIsWalletUser(false);
            });
        return () => { cancelled = true; };
    }, []);

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

            // Definitive wallet check: query the DB-backed endpoint.
            // This is the authoritative source — createUserWithWallet()
            // always creates a linked_accounts row with provider='wallet'.
            let walletUser = isWalletUser;
            if (!walletUser) {
                try {
                    const res = await fetch('/api/auth/linked-accounts');
                    const linked = await res.json();
                    walletUser = !!linked.hasWallet;
                } catch { /* fall through with false */ }
            }

            if (walletUser) {
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
