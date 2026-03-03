'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useWalletAuth } from '@/context/hooks/useWalletAuth';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { goeyToast } from 'goey-toast';

/**
 * Login page — purely a form, no auth enforcement.
 *
 * Auth enforcement is handled server-side by proxy.ts:
 *   - If user already has a valid session → proxy redirects to /dashboard or /onboarding
 *   - If user has a stale/invalid token → proxy clears the cookie and shows this page
 *   - If user is unauthenticated → proxy lets this page through
 *
 * This page should NEVER call signOut() or do auth redirects.
 */
export default function LoginPage() {
    const { authenticate, isAuthenticating, error: walletError } = useWalletAuth();
    const searchParams = useSearchParams();
    const t = useTranslations('login');
    const [signingIn, setSigningIn] = useState<string | null>(null);

    // Decrypt callback URL from proxy redirect (if present)
    const [callbackUrl, setCallbackUrl] = useState('/dashboard');

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            fetch(`/api/auth/callback-url?token=${encodeURIComponent(token)}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.url) setCallbackUrl(data.url);
                })
                .catch(() => { /* fallback to /dashboard */ });
        }
    }, [searchParams]);

    // Show toast on arrival after signout or session expiry
    useEffect(() => {
        if (sessionStorage.getItem('auth_signout')) {
            sessionStorage.removeItem('auth_signout');
            goeyToast.success('Signed out successfully');
        } else if (sessionStorage.getItem('auth_session_expired')) {
            sessionStorage.removeItem('auth_session_expired');
            goeyToast.warning('Session expired — please sign in again');
        }
    }, []);

    // Show wallet errors as toasts
    useEffect(() => {
        if (walletError) {
            if (walletError.toLowerCase().includes('rejected') || walletError.toLowerCase().includes('cancelled')) {
                goeyToast.warning('Wallet request cancelled');
            } else if (walletError.toLowerCase().includes('not found') || walletError.toLowerCase().includes('no wallet')) {
                goeyToast.error('No Solana wallet found');
            } else if (walletError.toLowerCase().includes('session')) {
                goeyToast.error('Session creation failed');
            } else {
                goeyToast.error('Authentication failed');
            }
        }
    }, [walletError]);

    const handleSignIn = async (provider: string) => {
        setSigningIn(provider);

        const name = provider === 'google' ? 'Google' : 'GitHub';
        goeyToast.info(`Connecting to ${name}...`);

        try {
            const result = await signIn(provider, { callbackUrl, redirect: false });

            if (result?.error) {
                if (result.error === 'OAuthAccountNotLinked') {
                    goeyToast.error('Account linked to another provider');
                } else if (result.error === 'AccessDenied') {
                    goeyToast.warning('Access denied');
                } else if (result.error === 'OAuthCallbackError') {
                    goeyToast.warning(`${name} sign-in cancelled`);
                } else {
                    goeyToast.error(`${name} sign-in failed`);
                }
                setSigningIn(null);
            } else if (result?.url) {
                sessionStorage.setItem('auth_success', '1');
                window.location.href = result.url;
            }
        } catch {
            goeyToast.error('Network error — check your connection');
            setSigningIn(null);
        }
    };

    const handleWalletConnect = () => {
        goeyToast.info('Opening wallet...');
        authenticate();
    };

    return (
        <>
            <LandingNavbar minimal />
            <div className="login-grain relative flex min-h-screen items-center justify-center overflow-hidden p-4 pt-20">
                {/* ── Mesh gradient background (light mode) ── */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 dark:hidden"
                    style={{
                        background: [
                            'radial-gradient(ellipse 90% 70% at 25% 100%, rgba(255,210,63,0.50), transparent)',
                            'radial-gradient(ellipse 50% 40% at 80% 15%, rgba(0,140,76,0.22), transparent)',
                            'radial-gradient(ellipse 80% 50% at 50% 90%, rgba(47,107,63,0.30), transparent)',
                            'radial-gradient(ellipse 40% 35% at 15% 40%, rgba(255,210,63,0.20), transparent)',
                            'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(247,234,203,0.45), transparent)',
                            'radial-gradient(ellipse 35% 30% at 75% 65%, rgba(0,140,76,0.12), transparent)',
                            'radial-gradient(ellipse 100% 40% at 50% 100%, rgba(47,107,63,0.15), transparent)',
                        ].join(', '),
                    }}
                />
                {/* ── Mesh gradient background (dark mode) ── */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 hidden dark:block"
                    style={{
                        background: [
                            'radial-gradient(ellipse 90% 60% at 25% 100%, rgba(255,210,63,0.25), transparent)',
                            'radial-gradient(ellipse 50% 40% at 80% 15%, rgba(0,140,76,0.30), transparent)',
                            'radial-gradient(ellipse 80% 50% at 50% 90%, rgba(47,107,63,0.28), transparent)',
                            'radial-gradient(ellipse 40% 35% at 15% 35%, rgba(0,140,76,0.15), transparent)',
                            'radial-gradient(ellipse 60% 60% at 50% 40%, rgba(0,140,76,0.12), transparent)',
                            'radial-gradient(ellipse 35% 30% at 70% 70%, rgba(255,210,63,0.10), transparent)',
                            'radial-gradient(ellipse 120% 50% at 50% 0%, rgba(27,35,29,0.40), transparent)',
                        ].join(', '),
                    }}
                />

                {/* Card */}
                <div className="relative z-10 w-full max-w-md">
                    <div className="relative overflow-hidden rounded-2xl border-2 border-[#d4c4a0] bg-[#f7eacb]/90 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-sm dark:border-[#245530] dark:bg-[#1a3d25]/90 dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                        {/* Grain texture overlay */}
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 z-20 rounded-2xl opacity-25 mix-blend-overlay dark:opacity-18 dark:mix-blend-soft-light"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'repeat',
                                backgroundSize: '256px 256px',
                            }}
                        />
                        {/* Subtle gradient bleed at top of card */}
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-0 top-0 h-40"
                            style={{
                                background:
                                    'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(0,140,76,0.08), transparent)',
                            }}
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-0 top-0 hidden h-40 dark:block"
                            style={{
                                background:
                                    'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(255,210,63,0.08), transparent)',
                            }}
                        />

                        <div className="relative z-10 px-8 pb-8 pt-10">
                            {/* Logo — st_icon in rounded container */}
                            <div className="mb-6 flex justify-center">
                                <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-brand-green-dark/20 shadow-md dark:border-white/15">
                                    <Image
                                        src="/favicon_io/android-chrome-192x192.png"
                                        alt="Superteam Academy"
                                        width={64}
                                        height={64}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            </div>

                            {/* Header */}
                            <div className="mb-8 text-center">
                                <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                                    {t('title')}
                                </h1>
                                <p className="mt-2 font-supreme text-sm text-muted-foreground">
                                    {t('subtitle')}
                                </p>
                            </div>

                            {/* OAuth buttons — horizontal row with brand colors */}
                            <div className="mb-5 flex gap-3">
                                {/* Google — white bg, original multicolor icon */}
                                <button
                                    id="google-auth-btn"
                                    onClick={() => handleSignIn('google')}
                                    disabled={signingIn !== null}
                                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/85 px-4 py-3 font-supreme text-sm font-medium text-gray-800 shadow-sm transition-all hover:bg-white disabled:cursor-wait disabled:opacity-50"
                                >
                                    {signingIn === 'google' ? (
                                        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-gray-800" />
                                    ) : (
                                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                    )}
                                    {signingIn === 'google' ? t('signingIn') : t('google')}
                                </button>

                                {/* GitHub — dark bg, white icon */}
                                <button
                                    id="github-auth-btn"
                                    onClick={() => handleSignIn('github')}
                                    disabled={signingIn !== null}
                                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#24292e] px-4 py-3 font-supreme text-sm font-medium text-white shadow-sm transition-all hover:bg-[#2f363d] disabled:cursor-wait disabled:opacity-50"
                                >
                                    {signingIn === 'github' ? (
                                        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                                    ) : (
                                        <svg className="h-5 w-5" fill="white" viewBox="0 0 24 24">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                    )}
                                    {signingIn === 'github' ? t('signingIn') : t('github')}
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-brand-green-dark/15 dark:border-white/15" />
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="bg-[#f7eacb] px-4 font-supreme font-medium uppercase tracking-wider text-muted-foreground dark:bg-[#1a3d25]">
                                        {t('orContinueWith')}
                                    </span>
                                </div>
                            </div>

                            {/* Wallet Connect — primary CTA */}
                            <button
                                id="wallet-connect-btn"
                                onClick={handleWalletConnect}
                                disabled={isAuthenticating || signingIn !== null}
                                className="cta-primary flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl py-3.5 font-supreme text-sm disabled:cursor-wait disabled:opacity-50"
                            >
                                {isAuthenticating ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-brand-black" />
                                ) : (
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                                    </svg>
                                )}
                                {isAuthenticating ? t('connecting') : t('connectWallet')}
                            </button>

                            {/* Footer */}
                            <p className="mt-6 text-center font-supreme text-xs text-muted-foreground">
                                {t('terms')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
