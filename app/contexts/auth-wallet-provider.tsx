"use client";
import { useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { createAuthClient, type AuthClient } from "@superteam-academy/auth";
import { createSignInMessage } from "@superteam-academy/auth";
import { walletEmail } from "@superteam-academy/auth";
import { isWalletEmail } from "@superteam-academy/auth";
import { syncAuthSession } from "../app/api/auth/sync/action";
import { AuthContext, type AuthSession, type AuthUser, type AuthContextType } from "./auth-context";
import { getGravatarUrl } from "@/lib/utils";

const authClient: AuthClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_AUTH_URL || "",
});

function AuthProviderInner({
	children,
	initialSession,
	walletAdaptersLoaded,
	ensureWalletAdaptersLoaded,
}: {
	children: ReactNode;
	initialSession: Record<string, Record<string, unknown>> | null;
	walletAdaptersLoaded: boolean;
	ensureWalletAdaptersLoaded: () => Promise<void>;
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
					walletAddress: initialSession.user.walletAddress as string | undefined,
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
					onboardingCompleted:
						syncedData?.onboardingCompleted ?? user?.onboardingCompleted,
					walletAddress: syncedData?.walletAddress,
				};

				setUser(userData);
				setSession(newSession);
			} catch {
				setSession(null);
				setUser(null);
			} finally {
				pendingRefreshRef.current = null;
			}
		};

		pendingRefreshRef.current = doRefresh();
		return pendingRefreshRef.current;
	}, [user?.onboardingCompleted]);

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
		const signature = Buffer.from(signatureBytes).toString("base64");

		const isOAuthSession = Boolean(session?.userId) && Boolean(user?.email);
		const hasWalletEmail = Boolean(user?.email && isWalletEmail(user.email));

		if (isOAuthSession && !hasWalletEmail) {
			const linkRes = await fetch("/api/auth/link-wallet", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					publicKey: wallet.publicKey.toBase58(),
					signature,
					message,
				}),
			});

			if (!linkRes.ok && linkRes.status !== 409) {
				const errorData = (await linkRes.json().catch(() => null)) as
					| { error?: string }
					| null;
				throw new Error(errorData?.error || "Wallet linking failed");
			}
		}

		const verifyRes = await fetch("/api/auth/wallet/verify", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				publicKey: wallet.publicKey.toBase58(),
				signature,
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
			isWalletAdaptersReady: walletAdaptersLoaded,
			session,
			user,
			isAuthenticated: (isWalletConnected && isWalletVerified) || isOAuthAuthenticated,
			isAdmin: user?.role === "admin" || user?.role === "superadmin",
			isSuperAdmin: user?.role === "superadmin",
			authMethod,
			refreshSession,
			ensureWalletAdaptersLoaded,
			verifyWallet,
			signInWithOAuth,
			signOut,
		}),
		[
			wallet,
			isWalletConnected,
			isWalletVerified,
			walletAdaptersLoaded,
			session,
			user,
			isOAuthAuthenticated,
			authMethod,
			refreshSession,
			ensureWalletAdaptersLoaded,
			verifyWallet,
			signInWithOAuth,
			signOut,
		]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const ENDPOINT = (() => {
	const explicit = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
	if (explicit) return explicit;
	const heliusKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
	if (heliusKey) return `https://devnet.helius-rpc.com/?api-key=${heliusKey}`;
	return "https://api.devnet.solana.com";
})();

function deriveWalletNetwork(endpoint: string): WalletAdapterNetwork {
	const normalizedEndpoint = endpoint.toLowerCase();
	if (normalizedEndpoint.includes("mainnet")) return WalletAdapterNetwork.Mainnet;
	if (normalizedEndpoint.includes("testnet")) return WalletAdapterNetwork.Testnet;
	return WalletAdapterNetwork.Devnet;
}

const WALLET_NETWORK = deriveWalletNetwork(ENDPOINT);

export function AuthWalletProvider({
	children,
	initialSession,
}: {
	children: ReactNode;
	initialSession: Record<string, Record<string, unknown>> | null;
}) {
	const [wallets, setWallets] = useState<Parameters<typeof WalletProvider>[0]["wallets"]>([]);
	const [walletAdaptersLoaded, setWalletAdaptersLoaded] = useState(false);
	const loadingWalletAdaptersRef = useRef<Promise<void> | null>(null);

	const ensureWalletAdaptersLoaded = useCallback(async () => {
		if (walletAdaptersLoaded || wallets.length > 0) {
			return;
		}

		if (loadingWalletAdaptersRef.current) {
			return loadingWalletAdaptersRef.current;
		}

		const load = Promise.all([
			import("@solana/wallet-adapter-phantom"),
			import("@solana/wallet-adapter-solflare"),
		])
			.then(([phantom, solflare]) => {
				setWallets([
					new phantom.PhantomWalletAdapter({ network: WALLET_NETWORK }),
					new solflare.SolflareWalletAdapter({ network: WALLET_NETWORK }),
				]);
				setWalletAdaptersLoaded(true);
			})
			.catch(() => {
				setWallets([]);
			})
			.finally(() => {
				loadingWalletAdaptersRef.current = null;
			});

		loadingWalletAdaptersRef.current = load;
		return load;
	}, [walletAdaptersLoaded, wallets.length]);

	// Eagerly load wallet adapters when the session has a wallet address
	// so autoConnect can reconnect without user interaction
	const hasWalletSession = Boolean(initialSession?.user?.walletAddress);
	useEffect(() => {
		if (hasWalletSession && !walletAdaptersLoaded) {
			void ensureWalletAdaptersLoaded();
		}
	}, [hasWalletSession, walletAdaptersLoaded, ensureWalletAdaptersLoaded]);

	return (
		<ConnectionProvider endpoint={ENDPOINT}>
			<WalletProvider wallets={wallets} autoConnect={wallets.length > 0}>
				<AuthProviderInner
					initialSession={initialSession}
					walletAdaptersLoaded={walletAdaptersLoaded}
					ensureWalletAdaptersLoaded={ensureWalletAdaptersLoaded}
				>
					{children}
				</AuthProviderInner>
			</WalletProvider>
		</ConnectionProvider>
	);
}
