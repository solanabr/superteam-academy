"use client";
import { useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
	AlphaWalletAdapter,
	PhantomWalletAdapter,
	SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { createAuthClient, type AuthClient } from "@superteam-academy/auth";
import { createSignInMessage } from "@superteam-academy/auth";
import { walletEmail } from "@superteam-academy/auth";
import { syncAuthSession } from "../app/api/auth/sync/action";
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
	initialSession: Record<string, Record<string, unknown>> | null;
}) {
	const wallet = useWallet();
	const [session, setSession] = useState<AuthSession | null>(
		initialSession
			? {
					id: initialSession.session.id as string,
					expiresAt: new Date(initialSession.session.expiresAt as string),
					userId: initialSession.user.id as string,
				}
			: null
	);
	const [user, setUser] = useState<AuthUser | null>(
		initialSession
			? {
					id: initialSession.user.id as string,
					name: initialSession.user.name as string,
					email: initialSession.user.email as string,
					image: initialSession.user.image as string,
					role: initialSession.user.role as never,
					onboardingCompleted: initialSession.user.onboardingCompleted as boolean,
				}
			: null
	);
	const [isWalletVerified, setIsWalletVerified] = useState(false);
	const pendingRefreshRef = useRef<Promise<void> | null>(null);

	const refreshSession = useCallback(async () => {
		if (pendingRefreshRef.current) {
			return pendingRefreshRef.current;
		}

		const doRefresh = async () => {
			try {
				const result = await authClient.getSession();

				if (!result.data) {
					setSession(null);
					setUser(null);
					return;
				}

				const syncedData = await syncAuthSession(result.data);
				const serverRole = syncedData?.role;

				const newSession: AuthSession = {
					id: result.data.session.id,
					expiresAt: new Date(result.data.session.expiresAt),
					userId: result.data.user.id,
				};

				const image =
					result.data.user.image ||
					getGravatarUrl(syncedData?.email || result.data.user.email);
				const userData: AuthUser = {
					id: result.data.user.id,
					name: result.data.user.name,
					email: syncedData?.email || result.data.user.email,
					image,
					role: serverRole,
					onboardingCompleted: syncedData?.onboardingCompleted ?? false,
				};

				setUser(userData);
				setSession(newSession);
			} finally {
				pendingRefreshRef.current = null;
			}
		};

		pendingRefreshRef.current = doRefresh();
		return pendingRefreshRef.current;
	}, []);

	useEffect(() => {
		if (!initialSession) {
			void refreshSession();
		}
	}, [refreshSession, initialSession]);

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

		if (session?.userId && user?.email === walletEmail(currentWallet)) {
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

		await refreshSession();
	}, [wallet, refreshSession, isWalletVerified, session, user]);

	const isWalletConnected = wallet.connected;
	const isOAuthAuthenticated = !!session;

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
			isAuthenticated: (isWalletConnected && isWalletVerified) || isOAuthAuthenticated,
			isAdmin: user?.role === "admin" || user?.role === "superadmin",
			isSuperAdmin: user?.role === "superadmin",
			authMethod,
			refreshSession,
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
			isOAuthAuthenticated,
			authMethod,
			refreshSession,
			verifyWallet,
			signInWithOAuth,
			signOut,
		]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const WALLETS = [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new AlphaWalletAdapter()];

export function AuthWalletProvider({
	children,
	initialSession,
}: {
	children: ReactNode;
	initialSession: Record<string, Record<string, unknown>> | null;
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
