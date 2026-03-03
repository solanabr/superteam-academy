'use client';

import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';

interface AuthContextType {
    user: {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        wallet_address?: string;
        linked_accounts?: { provider: string; provider_id: string }[];
        role?: string;
        onboardingComplete?: boolean;
    } | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthContextProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const clearingSession = useRef(false);

    // Targeted client-side enforcement for ONE case only:
    // The user was deleted from DB while they had an active page open.
    //
    // Why this is needed:
    //   - NextAuth v4 doesn't re-encode the JWT cookie on GET /api/auth/session
    //   - So the old cookie with the valid userId persists in the browser
    //   - The proxy reads this stale cookie via getToken() and thinks the user is valid
    //   - The JWT callback detects the deletion and returns {user: null} in the session
    //   - But the cookie is never cleared → stale session forever
    //
    // This hook detects: status='authenticated' (cookie exists) BUT no user.id
    // (session endpoint returned empty user). It calls signOut() once to clear
    // the cookie, then hard-redirects to /login.
    useEffect(() => {
        if (status !== 'authenticated' || clearingSession.current) return;

        if (!session?.user?.id) {
            // If we're already on the login page, don't redirect to login.
            // This prevents the infinite loop: signOut → redirect /login → 
            // page reload → component remounts (ref resets) → signOut → ...
            if (typeof window !== 'undefined') {
                const path = window.location.pathname;
                // Skip redirect on login page, public landing page, and public profile pages
                if (
                    path.includes('/login') ||
                    path.match(/^\/(en|es|pt-BR)\/?$/) ||
                    path.match(/\/profile\/[^/]+/)
                ) {
                    return;
                }
            }

            // Debounce: wait 500ms before clearing — avoids false triggers
            // during transient session refresh cycles (e.g., JWT callback
            // returning stale data momentarily).
            const timeout = setTimeout(() => {
                if (clearingSession.current) return;
                console.debug('[AuthProvider] Session invalid (no user ID), clearing cookie');
                clearingSession.current = true;
                sessionStorage.setItem('auth_session_expired', '1');

                signOut({ redirect: false }).then(() => {
                    window.location.href = '/login';
                });
            }, 500);
            return () => clearTimeout(timeout);
        }
    }, [session, status]);

    // Simply read the session — all other auth enforcement is server-side in proxy.ts.
    const user = session?.user?.id
        ? {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
            wallet_address: session.walletAddress,
            linked_accounts: session.linkedAccounts,
            role: (session.user as Record<string, unknown>).role as string | undefined,
            onboardingComplete: (session.user as Record<string, unknown>).onboardingComplete as boolean | undefined,
        }
        : null;

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading: status === 'loading',
                isAuthenticated: status === 'authenticated' && !!session?.user?.id,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function AuthProvider({ children }: { children: ReactNode }) {
    return (
        <SessionProvider refetchOnWindowFocus={false}>
            <AuthContextProvider>{children}</AuthContextProvider>
        </SessionProvider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
