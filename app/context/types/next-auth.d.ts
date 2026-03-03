import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            role?: string;
            onboardingComplete?: boolean;
            isAdmin?: boolean;
        };
        linkedAccounts?: { provider: string; provider_id: string }[];
        walletAddress?: string;
    }

    interface User {
        id: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        userId?: string;
        provider?: string;
        walletAddress?: string;
        linkedAccounts?: { provider: string; provider_id: string }[];
        role?: string;
        onboardingComplete?: boolean;
        sessionVersion?: number;
        isAdmin?: boolean;
        lastChecked?: number;
        sessionInvalid?: boolean;
    }
}
