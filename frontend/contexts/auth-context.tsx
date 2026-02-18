"use client";
import {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	useMemo,
	type ReactNode,
} from "react";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { createAuthClient, type AuthClient } from "@superteam/auth";
import { createSignInMessage } from "@superteam/auth";

import "@solana/wallet-adapter-react-ui/styles.css";

const authClient: AuthClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:3000",
});

interface AuthSession {
	id: string;
	expiresAt: Date;
	userId: string;
}

interface AuthUser {
	id: string;
	name: string;
	email: string;
	image?: string;
}

interface AuthContextType {
	wallet: ReturnType<typeof useWallet>;
	isWalletConnected: boolean;
	isWalletVerified: boolean;

	session: AuthSession | null;
	user: AuthUser | null;
	isOAuthLoading: boolean;

	isAuthenticated: boolean;
	authMethod: "wallet" | "oauth" | "linked" | null;

	verifyWallet: () => Promise<void>;
	signInWithOAuth: (provider: "google" | "github") => Promise<void>;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProviderInner({ children }: { children: ReactNode }) {
	const wallet = useWallet();
	const [session, setSession] = useState<AuthSession | null>(null);
	const [user, setUser] = useState<AuthUser | null>(null);
	const [isOAuthLoading, setIsOAuthLoading] = useState(true);
	const [isWalletVerified, setIsWalletVerified] = useState(false);

	useEffect(() => {
		const loadSession = async () => {
			try {
				const result = await authClient.getSession();
				if (result.data) {
					setSession({
						id: result.data.session.id,
						expiresAt: new Date(result.data.session.expiresAt),
						userId: result.data.user.id,
					});
					setUser({
						id: result.data.user.id,
						name: result.data.user.name,
						email: result.data.user.email,
						image: result.data.user.image ?? "",
					});
				}
			} catch {
				// No session
			} finally {
				setIsOAuthLoading(false);
			}
		};
		loadSession();
	}, []);

	useEffect(() => {
		if (!wallet.connected) {
			setIsWalletVerified(false);
		}
	}, [wallet.connected]);

	const verifyWallet = useCallback(async () => {
		if (!wallet.publicKey || !wallet.signMessage) {
			throw new Error("Wallet must be connected and support message signing");
		}

		const nonceRes = await fetch("/api/auth/wallet/nonce");
		if (!nonceRes.ok) throw new Error("Failed to get nonce");
		const { nonce, domain } = (await nonceRes.json()) as { nonce: string; domain: string };

		const message = createSignInMessage(nonce, domain);
		const messageBytes = new TextEncoder().encode(message);
		const signatureBytes = await wallet.signMessage(messageBytes);

		const verifyRes = await fetch("/api/auth/wallet/verify", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				publicKey: wallet.publicKey.toBase58(),
				signature: Buffer.from(signatureBytes).toString("base64"),
				message,
			}),
		});

		if (!verifyRes.ok) {
			const errorData = (await verifyRes.json()) as { error: string };
			throw new Error(errorData.error || "Wallet verification failed");
		}

		setIsWalletVerified(true);
	}, [wallet]);

	const isWalletConnected = wallet.connected;
	const isOAuthAuthenticated = !!session;
	const isAuthenticated = (isWalletConnected && isWalletVerified) || isOAuthAuthenticated;
	const authMethod =
		isWalletVerified && isOAuthAuthenticated
			? "linked"
			: isWalletVerified
				? "wallet"
				: isOAuthAuthenticated
					? "oauth"
					: null;

	const signInWithOAuth = useCallback(async (provider: "google" | "github") => {
		await authClient.signIn.social({ provider, callbackURL: "/" });
	}, []);

	const signOut = useCallback(async () => {
		await authClient.signOut();
		if (wallet.connected) {
			await wallet.disconnect();
		}
		setSession(null);
		setUser(null);
		setIsWalletVerified(false);
	}, [wallet]);

	const value: AuthContextType = useMemo(
		() => ({
			wallet,
			isWalletConnected,
			isWalletVerified,
			session,
			user,
			isOAuthLoading,
			isAuthenticated,
			authMethod,
			verifyWallet,
			signInWithOAuth,
			signOut,
		}),
		[
			wallet,
			isWalletConnected,
			isWalletVerified,
			session,
			user,
			isOAuthLoading,
			isAuthenticated,
			authMethod,
			verifyWallet,
			signInWithOAuth,
			signOut,
		]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const DEVNET_ENDPOINT = clusterApiUrl("devnet");
const WALLETS = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

export function AuthProvider({ children }: { children: ReactNode }) {
	return (
		<ConnectionProvider endpoint={DEVNET_ENDPOINT}>
			<WalletProvider wallets={WALLETS} autoConnect>
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
