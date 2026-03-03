export interface LinkedAccount {
    id: string;
    user_id: string;
    provider: 'wallet' | 'google' | 'github';
    provider_id: string;
    provider_data: Record<string, unknown> | null;
    created_at: string;
}

export interface User {
    id: string;
    wallet_address: string | null;
    email: string | null;
    name: string | null;
    username: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
    linked_accounts?: LinkedAccount[];
}

export interface AuthSession {
    access_token: string;
    refresh_token: string;
    expires_at: number;
}

export interface WalletAuthError {
    code: string;
    message: string;
}

export interface AuthResponse {
    user: User;
    session: AuthSession;
    is_new_user: boolean;
}
