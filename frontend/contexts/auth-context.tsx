"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    TorusWalletAdapter,
    LedgerWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { type AuthClient, createAuthClient } from "@superteam/auth";

interface Session {
	id: string;
	expiresAt: Date;
	userId: string;
}

interface User {
	id: string;
	name: string;
	email: string;
	image?: string | undefined;
}

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:3000",
}) as AuthClient & {
	getSession: () => Promise<{ session: Session; user: User } | null>;
	signIn: { social: (opts: { provider: string }) => Promise<void> };
	signOut: () => Promise<void>;
};

interface AuthContextType {
	// Wallet auth
	wallet: ReturnType<typeof useWallet>;
	isWalletConnected: boolean;

	// OAuth auth
	session: Session | null;
	user: User | null;
	isOAuthLoading: boolean;

	// Combined auth state
	isAuthenticated: boolean;
	authMethod: "wallet" | "oauth" | "linked" | null;

	// Actions
	signInWithOAuth: (provider: "google" | "github") => Promise<void>;
	signOut: () => Promise<void>;
	linkWallet: () => Promise<void>;
	unlinkWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
	children: ReactNode;
}

function AuthProviderInner({ children }: AuthProviderProps) {
	const wallet = useWallet();
	const [session, setSession] = useState<Session | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [isOAuthLoading, setIsOAuthLoading] = useState(true);

	// Load OAuth session on mount
	useEffect(() => {
		const loadSession = async () => {
			try {
				const currentSession = await authClient.getSession?.();
				setSession(currentSession?.session ?? null);
				setUser(currentSession?.user ?? null);
			} catch (error) {
				console.error("Failed to load session:", error);
			} finally {
				setIsOAuthLoading(false);
			}
		};

		loadSession();
	}, []);

	// Determine authentication state
	const isWalletConnected = wallet.connected;
	const isOAuthAuthenticated = !!session;
	const isAuthenticated = isWalletConnected || isOAuthAuthenticated;
	const authMethod =
		isWalletConnected && isOAuthAuthenticated
			? "linked"
			: isWalletConnected
				? "wallet"
				: isOAuthAuthenticated
					? "oauth"
					: null;

	const signInWithOAuth = async (provider: "google" | "github") => {
		await authClient.signIn.social({ provider });
	};

	const signOut = async () => {
		// Sign out from OAuth
		await authClient.signOut();

		// Disconnect wallet
		if (wallet.connected) {
			await wallet.disconnect();
		}

		setSession(null);
		setUser(null);
	};

	const linkWallet = async () => {
		// TODO: Implement wallet linking logic with conflict resolution
		// This would associate the current wallet with the OAuth account in the database
		if (!isWalletConnected) {
			throw new Error("Wallet must be connected to link");
		}
		if (!session) {
			throw new Error("OAuth session required for linking");
		}

		// Simulate potential conflict detection
		const hasConflict = Math.random() > 0.8; // 20% chance of conflict for demo
		if (hasConflict) {
			throw new Error(
				"Wallet is already linked to another account. Please resolve the conflict first."
			);
		}
	};

	const unlinkWallet = async () => {
		// TODO: Implement wallet unlinking logic
		// This would disassociate the wallet from the OAuth account
		if (!session) {
			throw new Error("OAuth session required for unlinking");
		}
	};

	const value: AuthContextType = {
		wallet,
		isWalletConnected,
		session,
		user,
		isOAuthLoading,
		isAuthenticated,
		authMethod,
		signInWithOAuth,
		signOut,
		linkWallet,
		unlinkWallet,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: AuthProviderProps) {
	// Wallet configuration
	const network = clusterApiUrl("devnet");
	const wallets = [
		new PhantomWalletAdapter(),
		new SolflareWalletAdapter(),
		new TorusWalletAdapter(),
		new LedgerWalletAdapter(),
	];

	return (
		<ConnectionProvider endpoint={network}>
			<WalletProvider wallets={wallets} autoConnect={true}>
				<WalletModalProvider>
					<AuthProviderInner>{children}</AuthProviderInner>
				</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
