"use client";
import { useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { createAuthClient, type AuthClient } from "@superteam-academy/auth";
import { createSignInMessage } from "@superteam-academy/auth";
import { AuthContext, type AuthSession, type AuthUser, type AuthContextType } from "./auth-context";
import { getGravatarUrl } from "@/lib/utils";

import "@solana/wallet-adapter-react-ui/styles.css";

const authClient: AuthClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:3000",
});

function AuthProviderInner({
	children,
	initialSession,
}: {
	children: ReactNode;
	initialSession: AuthSession | null;
}) {
	const wallet = useWallet();
	const [session, setSession] = useState<AuthSession | null>(initialSession ?? null);
	const [user, setUser] = useState<AuthUser | null>(null);
	const [isOAuthLoading, setIsOAuthLoading] = useState(true);
	const [isWalletVerified, setIsWalletVerified] = useState(false);

	const refreshSession = useCallback(async () => {
		const result = await authClient.getSession();

		if (!result.data) {
			setSession(null);
			setUser(null);
			return;
		}

		setSession({
			id: result.data.session.id,
			expiresAt: new Date(result.data.session.expiresAt),
			userId: result.data.user.id,
		});

		const image = result.data.user.image || getGravatarUrl(result.data.user.email);
		const userData: AuthUser = {
			id: result.data.user.id,
			name: result.data.user.name,
			email: result.data.user.email,
			image,
		};
		setUser(userData);

		try {
			const syncRes = await fetch("/api/auth/sync", { method: "POST" });
			if (syncRes.ok) {
				const syncData = (await syncRes.json()) as { synced: boolean; role?: string };
				if (syncData.synced && syncData.role) {
					const role = syncData.role as NonNullable<AuthUser["role"]>;
					setUser((prev) => (prev ? { ...prev, role } : prev));
				}
			}
		} catch {
			// Sync failure is non-blocking
		}
	}, []);

	useEffect(() => {
		const loadSession = async () => {
			try {
				await refreshSession();
			} catch {
				// No session
			} finally {
				setIsOAuthLoading(false);
			}
		};
		loadSession();
	}, [refreshSession]);

	useEffect(() => {
		if (!wallet.connected) {
			setIsWalletVerified(false);
		}
	}, [wallet.connected]);

	const verifyWallet = useCallback(async () => {
		if (!wallet.publicKey || !wallet.signMessage) {
			throw new Error("Wallet must be connected and support message signing");
		}

		const currentWallet = wallet.publicKey.toBase58();
		if (isWalletVerified) {
			return;
		}

		if (session?.userId && user?.email === `${currentWallet}@wallet.superteam.local`) {
			setIsWalletVerified(true);
			return;
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

		void refreshSession();
	}, [wallet, refreshSession, isWalletVerified, session, user]);

	const isWalletConnected = wallet.connected;
	const isOAuthAuthenticated = !!session;
	const isAuthenticated = (isWalletConnected && isWalletVerified) || isOAuthAuthenticated;
	const isAdmin = user?.role === "admin" || user?.role === "superadmin";
	const isSuperAdmin = user?.role === "superadmin";
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
			wallet: wallet as AuthContextType["wallet"],
			isWalletConnected,
			isWalletVerified,
			session,
			user,
			isOAuthLoading,
			isAuthenticated,
			isAdmin,
			isSuperAdmin,
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
			isAdmin,
			isSuperAdmin,
			authMethod,
			verifyWallet,
			signInWithOAuth,
			signOut,
		]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const WALLETS = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

export function AuthWalletProvider({
	children,
	initialSession,
}: {
	children: ReactNode;
	initialSession: AuthSession | null;
}) {
	return (
		<ConnectionProvider endpoint={ENDPOINT}>
			<WalletProvider wallets={WALLETS} autoConnect>
				<WalletModalProvider>
					<AuthProviderInner initialSession={initialSession}>
						{children}
					</AuthProviderInner>
				</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
}
