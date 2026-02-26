"use client";
import { createContext, useContext, type ReactNode } from "react";

export interface AuthSession {
	id: string;
	expiresAt: Date;
	userId: string;
}

export interface AuthUser {
	id: string;
	name: string;
	email: string;
	image?: string;
	role?: "learner" | "admin" | "superadmin";
	onboardingCompleted?: boolean;
}

export interface WalletState {
	connected: boolean;
	connecting: boolean;
	disconnecting: boolean;
	publicKey: { toBase58(): string } | null;
	signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
	sendTransaction?: (...args: unknown[]) => Promise<string>;
	disconnect: () => Promise<void>;
	connect: () => Promise<void>;
	select: (walletName: unknown) => void;
	wallet: { adapter: { name: string; icon: string } } | null;
	wallets: { adapter: { name: string; icon: string } }[];
}

export interface AuthContextType {
	wallet: WalletState;
	isWalletConnected: boolean;
	isWalletVerified: boolean;

	session: AuthSession | null;
	user: AuthUser | null;
	isOAuthLoading: boolean;

	isAuthenticated: boolean;
	isAdmin: boolean;
	isSuperAdmin: boolean;
	authMethod: "wallet" | "oauth" | "linked" | null;

	verifyWallet: () => Promise<void>;
	signInWithOAuth: (provider: "google" | "github") => Promise<void>;
	signOut: () => Promise<void>;
}

const noop = async () => undefined;

const defaultAuth: AuthContextType = {
	wallet: {
		connected: false,
		connecting: false,
		disconnecting: false,
		publicKey: null,
		disconnect: noop,
		connect: noop,
		select: () => undefined,
		wallet: null,
		wallets: [],
	},
	isWalletConnected: false,
	isWalletVerified: false,
	session: null,
	user: null,
	isOAuthLoading: false,
	isAuthenticated: false,
	isAdmin: false,
	isSuperAdmin: false,
	authMethod: null,
	verifyWallet: noop,
	signInWithOAuth: noop,
	signOut: noop,
};

export const AuthContext = createContext<AuthContextType>(defaultAuth);

export function AuthFallbackProvider({ children }: { children: ReactNode }) {
	return <AuthContext.Provider value={defaultAuth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	return useContext(AuthContext);
}
