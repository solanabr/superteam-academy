/**
 * @fileoverview Account settings component for managing connected wallets and OAuth accounts.
 */
"use client";

import {
	LinkIcon,
	ShieldCheckIcon,
	TrashIcon,
	WalletIcon,
} from "@phosphor-icons/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import bs58 from "bs58";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { GitHubIcon, GoogleIcon } from "@/components/shared/Icons";
import { WalletModal } from "@/components/shared/WalletModal";
import {
	deleteWalletAction,
	linkWalletAction,
	listUserWallets,
} from "@/lib/actions/wallets";
import { authClient, linkSocial, useSession } from "@/lib/auth/client";

// providers are moved to shared/Icons.tsx

export function AccountSettings() {
	const t = useTranslations("Settings.account");
	const locale = useLocale();
	const queryClient = useQueryClient();
	const { publicKey, signMessage } = useWallet();
	const [walletModalOpen, setWalletModalOpen] = useState(false);
	const { data: sessionData } = useSession();

	// Fetch accounts via React Query
	const { data: accounts = [] } = useQuery({
		queryKey: ["auth-accounts"],
		queryFn: async () => {
			const { data } = await authClient.listAccounts();
			return data || [];
		},
		enabled: !!sessionData,
	});

	// Fetch wallets via React Query
	const { data: userWallets = [] } = useQuery({
		queryKey: ["user-wallets"],
		queryFn: async () => {
			const { data } = await listUserWallets();
			return data || [];
		},
		enabled: !!sessionData,
	});

	// Mutations
	const linkMutation = useMutation({
		mutationFn: async ({
			address,
			signature,
			message,
		}: {
			address: string;
			signature: string;
			message: string;
		}) => {
			const { error } = await linkWalletAction(address, signature, message);
			if (error) throw new Error(error);
			return true;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["auth-accounts"] });
			queryClient.invalidateQueries({ queryKey: ["user-wallets"] });
			toast.success(t("walletLinked"));
			window.location.reload(); // Still needed to refresh BA internal state if necessary, but ideally we transition away
		},
		onError: (error) => {
			toast.error(error.message || t("walletError"));
		},
	});

	const unlinkMutation = useMutation({
		mutationFn: async () => {
			const result = await authClient.unlinkAccount({ providerId: "solana" });
			if (result.error) throw new Error(result.error.message);
			return true;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["auth-accounts"] });
			queryClient.invalidateQueries({ queryKey: ["user-wallets"] });
			toast.success(t("walletUnlinked") || "Wallet unlinked successfully");
			window.location.reload();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to unlink wallet");
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (address: string) => {
			const result = await deleteWalletAction(address);
			if (!result.success) throw new Error(result.error);
			return true;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["user-wallets"] });
			toast.success("Wallet removed");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to remove wallet");
		},
	});

	const handleLinkWallet = async () => {
		if (!publicKey || !signMessage) {
			setWalletModalOpen(true);
			return;
		}

		try {
			const message = `Link this wallet to Superteam Academy: ${Date.now()}`;
			const messageBytes = new TextEncoder().encode(message);
			const signedMessage = await signMessage(messageBytes);
			const signature = bs58.encode(signedMessage);

			await linkMutation.mutateAsync({
				address: publicKey.toBase58(),
				signature,
				message,
			});

			// Optional: System logs logic can be moved into onSuccess of mutation if persistent
		} catch (e) {
			console.error(e);
		}
	};

	const handleLinkOAuth = async (provider: "github" | "google") => {
		try {
			await linkSocial({ provider, callbackURL: `/${locale}/settings` });
		} catch {
			toast.error(t("oauthError", { provider }));
		}
	};

	const primarySolanaAccount = accounts.find(
		(acc) => acc.providerId === "solana",
	);
	const primarySolanaAddress = primarySolanaAccount?.accountId;
	const currentWalletAddress = publicKey?.toBase58();

	const isCurrentWalletPrimary = primarySolanaAddress === currentWalletAddress;
	const isCurrentWalletSecondary = userWallets.some(
		(w) => w.address === currentWalletAddress,
	);
	const isCurrentWalletLinked =
		isCurrentWalletPrimary || isCurrentWalletSecondary;

	const isLinking =
		linkMutation.isPending ||
		unlinkMutation.isPending ||
		deleteMutation.isPending;

	const email = sessionData?.user?.email;

	const PROVIDERS = [
		{ id: "google" as const, label: "Google", icon: <GoogleIcon /> },
		{
			id: "github" as const,
			label: "GitHub",
			icon: <GitHubIcon className="w-4 h-4" />,
		},
	];

	return (
		<div className="border border-border bg-bg-surface p-6 flex flex-col gap-5">
			<div className="border-b border-border pb-2 mb-2 flex items-center gap-2 font-bold uppercase tracking-widest text-[11px]">
				<ShieldCheckIcon size={14} weight="duotone" /> {t("title")}
			</div>

			{/* Primary Email */}
			<div className="flex flex-col gap-1.5">
				<label className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest">
					{t("emailLabel")}
				</label>
				<input
					type="email"
					readOnly
					value={email ?? "—"}
					className="bg-transparent border border-ink-secondary/40 px-2.5 py-2.5 text-[13px] font-mono text-ink-secondary cursor-not-allowed outline-none"
				/>
				<span className="text-[10px] text-ink-secondary tracking-widest">
					{t("emailHint")}
				</span>
			</div>

			{/* Connected Wallets */}
			<div className="flex flex-col gap-3">
				<label className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest">
					{t("walletsLabel")}
				</label>

				{/* All Wallets List */}
				<div className="flex flex-col gap-2">
					{/* Primary Account Wallet */}
					{primarySolanaAddress && (
						<div className="flex items-center justify-between border border-border px-4 py-4 bg-bg-base/50">
							<div className="flex items-center gap-4">
								<div className="p-2 bg-yellow-500/10 rounded-sm">
									<WalletIcon
										size={24}
										weight="duotone"
										className="text-yellow-500"
									/>
								</div>
								<div className="flex flex-col">
									<span className="text-[11px] font-bold tracking-widest uppercase text-ink-primary font-mono">
										Wallet: {primarySolanaAddress.slice(0, 8)}...
										{primarySolanaAddress.slice(-8)}
									</span>
								</div>
							</div>
							<div className="flex items-center gap-3">
								{isCurrentWalletPrimary && (
									<span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-none border border-emerald-500/20">
										Active
									</span>
								)}
								<button
									type="button"
									onClick={() => unlinkMutation.mutate()}
									disabled={isLinking}
									className="shrink-0 border border-ink-secondary/20 bg-transparent px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-600 transition-all disabled:opacity-50 flex items-center gap-2"
								>
									<TrashIcon size={14} />
									{unlinkMutation.isPending ? "..." : "Remove"}
								</button>
							</div>
						</div>
					)}

					{/* Secondary Wallets */}
					{userWallets
						.filter((w) => w.address !== primarySolanaAddress)
						.map((w) => {
							const isThisWalletConnected = w.address === currentWalletAddress;
							return (
								<div
									key={w.id}
									className="flex items-center justify-between border border-border px-4 py-4 bg-ink-secondary/5"
								>
									<div className="flex items-center gap-4">
										<div className="p-2 bg-ink-secondary/10 rounded-sm">
											<WalletIcon
												size={24}
												weight="duotone"
												className="text-ink-secondary"
											/>
										</div>
										<div className="flex flex-col">
											<span className="text-[11px] font-bold tracking-widest uppercase text-ink-primary font-mono">
												Wallet: {w.address.slice(0, 8)}...{w.address.slice(-8)}
											</span>
										</div>
									</div>
									<div className="flex items-center gap-3">
										{isThisWalletConnected && (
											<span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-none border border-emerald-500/20">
												Connected
											</span>
										)}
										<button
											type="button"
											onClick={() => deleteMutation.mutate(w.address)}
											disabled={isLinking}
											className="shrink-0 border border-ink-secondary/20 bg-transparent px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-600 transition-all disabled:opacity-50 flex items-center gap-2"
										>
											<TrashIcon size={14} />
											{deleteMutation.isPending ? "..." : "Remove"}
										</button>
									</div>
								</div>
							);
						})}

					{/* If no wallets at all linked */}
					{!primarySolanaAddress && userWallets.length === 0 && (
						<div className="border border-dashed border-ink-secondary/30 p-8 flex flex-col items-center justify-center gap-4 bg-ink-secondary/5">
							<WalletIcon
								size={32}
								weight="duotone"
								className="text-ink-secondary opacity-50"
							/>
							<div className="text-center">
								<p className="text-[11px] font-bold uppercase tracking-widest text-ink-primary">
									No wallet linked to identity
								</p>
								<p className="text-[10px] text-ink-secondary uppercase tracking-widest mt-1">
									Link a wallet to verify your on-chain credentials
								</p>
							</div>
							<button
								onClick={handleLinkWallet}
								disabled={isLinking}
								className="bg-ink-primary text-bg-base px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-ink-secondary transition-all flex items-center gap-2"
							>
								{isLinking ? "..." : "Link Primary Wallet"}
							</button>
						</div>
					)}
				</div>

				{/* Option to link current wallet if not linked */}
				{publicKey && !isCurrentWalletLinked && (
					<div className="flex flex-col gap-4 p-5 border border-ink-primary/20 bg-ink-primary/5 mt-2 animate-in fade-in slide-in-from-top-1">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<div className="p-2 bg-ink-primary/10 rounded-none">
									<WalletIcon
										size={24}
										weight="duotone"
										className="text-ink-primary"
									/>
								</div>
								<div className="flex flex-col">
									<span className="text-[10px] font-black uppercase tracking-widest text-ink-primary mb-1">
										New Wallet Detected
									</span>
									<span className="text-[11px] font-mono text-ink-secondary">
										{currentWalletAddress?.slice(0, 12)}...
										{currentWalletAddress?.slice(-10)}
									</span>
								</div>
							</div>
							<button
								onClick={handleLinkWallet}
								disabled={isLinking}
								className="shrink-0 bg-ink-primary text-bg-base px-5 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-ink-secondary transition-all disabled:opacity-50 flex items-center gap-2"
							>
								<LinkIcon size={14} />
								Link to Account
							</button>
						</div>
					</div>
				)}
			</div>

			{/* OAuth Providers */}
			<div className="flex flex-col gap-1.5">
				<label className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest">
					{t("oauthLabel")}
				</label>
				{PROVIDERS.map(({ id, label, icon }) => (
					<div
						key={id}
						className="flex items-center justify-between border border-border px-3 py-3"
					>
						<span className="flex items-center gap-2.5 text-[11px] font-bold tracking-widest">
							{icon}
							{label}
						</span>
						<button
							type="button"
							onClick={() => handleLinkOAuth(id)}
							className="border border-ink-secondary/40 bg-transparent px-3 py-1 text-[10px] uppercase tracking-widest hover:bg-ink-primary hover:text-bg-base transition-colors"
						>
							{t("link")}
						</button>
					</div>
				))}
			</div>

			<WalletModal open={walletModalOpen} onOpenChange={setWalletModalOpen} />
		</div>
	);
}
