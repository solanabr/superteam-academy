"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { AuthUser } from "@/lib/api";

/* ─── Types ─── */
interface AuthState {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, user: AuthUser) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    login: () => { },
    logout: () => { },
});

/* ─── Storage Keys ─── */
const TOKEN_KEY = "sollearn_token";
const USER_KEY = "sollearn_user";

/* ─── Provider ─── */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Hydrate from localStorage on mount
    useEffect(() => {
        try {
            const storedToken = localStorage.getItem(TOKEN_KEY);
            const storedUser = localStorage.getItem(USER_KEY);

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } catch {
            // Invalid stored data — clear it
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = useCallback((newToken: string, newUser: AuthUser) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token,
                isLoading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
