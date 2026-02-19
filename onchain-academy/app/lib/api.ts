const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

/* ─── Types ─── */
export interface AuthUser {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
    username?: string;
    totalXP: number;
    level: number;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    token: string;
    user: AuthUser;
}

export interface NonceResponse {
    success: boolean;
    nonce: string;
    message: string;
    expiresAt: string;
}

/* ─── API Helpers ─── */
async function post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data as T;
}

/* ─── Auth Endpoints ─── */

/** POST /auth/google — send Google id_token to backend */
export function googleAuth(idToken: string): Promise<AuthResponse> {
    return post<AuthResponse>("/auth/google", { idToken });
}

/** POST /auth/github — send GitHub OAuth code to backend */
export function githubAuth(code: string): Promise<AuthResponse> {
    return post<AuthResponse>("/auth/github", { code });
}

/** POST /auth/wallet/nonce — request a nonce for wallet signing */
export function walletGetNonce(publicKey: string): Promise<NonceResponse> {
    return post<NonceResponse>("/auth/wallet/nonce", { publicKey });
}

/** POST /auth/wallet/verify — verify signed message */
export function walletVerify(
    publicKey: string,
    signature: number[],
    nonce: string
): Promise<AuthResponse> {
    return post<AuthResponse>("/auth/wallet/verify", { publicKey, signature, nonce });
}
