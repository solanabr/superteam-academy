'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

function AuthCallbackContent() {
    const { status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    useEffect(() => {
        if (error) {
            router.replace(`/login?error=${error}`);
            return;
        }

        if (status === 'authenticated') {
            router.replace('/dashboard');
        } else if (status === 'unauthenticated') {
            router.replace('/login');
        }
    }, [status, error, router]);

    // Timeout: if session doesn't resolve within 10s, redirect to login
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (status === 'loading') {
                router.replace('/login?error=timeout');
            }
        }, 10_000);
        return () => clearTimeout(timeout);
    }, [status, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
            <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mx-auto mb-4" />
                <p className="text-gray-400">Finishing sign-in...</p>
            </div>
        </div>
    );
}

export default function AuthCallback() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-950">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
                </div>
            }
        >
            <AuthCallbackContent />
        </Suspense>
    );
}
