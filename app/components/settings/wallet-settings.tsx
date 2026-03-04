"use client";

import { useState, useEffect } from "react";
import { Wallet, ExternalLink, Copy, Check, RefreshCw, Link2, Unlink } from "lucide-react";
import { useRouter } from "@bprogress/next/app";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useSettingsSave } from "@/hooks/use-settings";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { createSignInMessage } from "@superteam-academy/auth";
import { truncateAddress } from "@/lib/utils";
import { canSignMessage } from "@/lib/solana-transaction";
import { useAsyncData } from "@/hooks/use-async-data";
import { fetchJson } from "@/lib/fetch-utils";

interface LinkedAccount {
	provider: "wallet" | "google" | "github" | "email";
	identifier: string;
	linkedAt: string;
}

export function WalletSettings() {
	const t = useTranslations("settings.walletSection");
	const { toast } = useToast();
	const router = useRouter();
	const { wallet, user } = useAuth();
	const {
		data,
		saving,
		handleSave: saveSettings,
	} = useSettingsSave({
		successTitle: t("toast.savedTitle"),
		errorTitle: t("toast.errorTitle"),
		errorDescription: t("toast.errorDescription"),
		onSuccess: () => router.refresh(),
	});
	const { copied, copy } = useCopyToClipboard();
	const [autoConnect, setAutoConnect] = useState(true);
	const [pendingProvider, setPendingProvider] = useState<string | null>(null);

	const {
		data: linkedAccounts,
		loading: accountsLoading,
		refetch: loadLinkedAccounts,
	} = useAsyncData(async () => {
		const { data } = await fetchJson<{ accounts?: LinkedAccount[] }>(
			"/api/auth/linked-accounts"
		);
		return data?.accounts ?? [];
	}, []);

	useEffect(() => {
		if (typeof data?.settings?.wallet?.autoConnect === "boolean") {
			setAutoConnect(data.settings.wallet.autoConnect);
		}
	}, [data]);

	const walletAddress = wallet.publicKey?.toBase58() ?? null;
	const walletName = wallet.wallet?.adapter.name ?? t("unknownWallet");

	const copyAddress = () => {
		if (walletAddress) copy(walletAddress);
	};

	const handleSave = () => saveSettings({ settings: { wallet: { autoConnect } } });

	const unlinkProvider = async (provider: string) => {
		setPendingProvider(provider);
		try {
			const response = await fetch("/api/auth/unlink", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ provider }),
			});

			if (!response.ok) {
				const errorData = (await response.json()) as { error?: string };
				toast({
					title: t("toast.unlinkFailedTitle"),
					description: errorData.error ?? t("toast.tryAgain"),
					variant: "destructive",
				});
				return;
			}

			await loadLinkedAccounts();
			toast({ title: t("toast.unlinkedTitle") });
		} catch {
			toast({
				title: t("toast.unlinkFailedTitle"),
				description: t("toast.tryAgain"),
				variant: "destructive",
			});
		} finally {
			setPendingProvider(null);
		}
	};

	const upsertOAuthProvider = async (provider: "google" | "github", reauth = false) => {
		setPendingProvider(provider);
		try {
			const identifier = user?.email ?? `${provider}@linked.account`;
			const response = await fetch("/api/auth/link-oauth", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ provider, identifier }),
			});

			if (!response.ok) {
				const errorData = (await response.json()) as { error?: string };
				toast({
					title: reauth ? t("toast.reauthFailedTitle") : t("toast.linkFailedTitle"),
					description: errorData.error ?? t("toast.tryAgain"),
					variant: "destructive",
				});
				return;
			}

			await loadLinkedAccounts();
			toast({ title: reauth ? t("toast.reauthedTitle") : t("toast.linkedTitle") });
		} catch {
			toast({
				title: reauth ? t("toast.reauthFailedTitle") : t("toast.linkFailedTitle"),
				description: t("toast.tryAgain"),
				variant: "destructive",
			});
		} finally {
			setPendingProvider(null);
		}
	};

	const linkCurrentWallet = async () => {
		if (!canSignMessage(wallet)) {
			toast({
				title: t("toast.signatureUnavailableTitle"),
				description: t("toast.signatureUnavailableDescription"),
				variant: "destructive",
			});
			return;
		}

		setPendingProvider("wallet");
		try {
			if (!wallet.signMessage || !wallet.publicKey) return;

			const nonceResponse = await fetch("/api/auth/wallet/nonce", { cache: "no-store" });
			if (!nonceResponse.ok) {
				throw new Error("Failed to create wallet nonce");
			}

			const { nonce, domain } = (await nonceResponse.json()) as {
				nonce: string;
				domain: string;
			};

			const message = createSignInMessage(nonce, domain);
			const signature = await wallet.signMessage(new TextEncoder().encode(message));

			const response = await fetch("/api/auth/link-wallet", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					publicKey: wallet.publicKey.toBase58(),
					signature: Buffer.from(signature).toString("base64"),
					message,
				}),
			});

			if (!response.ok) {
				const errorData = (await response.json()) as { error?: string };
				toast({
					title: t("toast.walletLinkFailedTitle"),
					description: errorData.error ?? t("toast.tryAgain"),
					variant: "destructive",
				});
				return;
			}

			await loadLinkedAccounts();
			toast({ title: t("toast.walletLinkedTitle") });
		} catch {
			toast({
				title: t("toast.walletLinkFailedTitle"),
				description: t("toast.tryAgain"),
				variant: "destructive",
			});
		} finally {
			setPendingProvider(null);
		}
	};

	const accounts = linkedAccounts ?? [];

	const isLinked = (provider: LinkedAccount["provider"]) =>
		accounts.some((account) => account.provider === provider);

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
				<div className="px-6 py-4 border-b border-border/40">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						{t("sections.connectedWallet")}
					</p>
				</div>
				<div className="divide-y divide-border/40">
					{walletAddress ? (
						<div className="px-6 py-4 flex items-center gap-4">
							<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
								<Wallet className="h-4 w-4 text-primary" />
							</div>

							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<p className="text-sm font-medium">{walletName}</p>
									<span className="text-[10px] font-medium uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
										{t("badges.primary")}
									</span>
									<span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
										solana
									</span>
								</div>
								<div className="flex items-center gap-2 mt-0.5">
									<code className="text-xs text-muted-foreground font-mono">
										{truncateAddress(walletAddress)}
									</code>
									<button
										type="button"
										onClick={copyAddress}
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										{copied ? (
											<Check className="h-3 w-3 text-green-500" />
										) : (
											<Copy className="h-3 w-3" />
										)}
									</button>
								</div>
							</div>

							<div className="flex items-center gap-1 shrink-0">
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 p-0"
									onClick={() =>
										window.open(
											`https://solscan.io/account/${walletAddress}`,
											"_blank",
											"noopener,noreferrer"
										)
									}
								>
									<ExternalLink className="h-3.5 w-3.5" />
								</Button>
							</div>
						</div>
					) : (
						<div className="px-6 py-8 text-center text-sm text-muted-foreground">
							{t("empty.noWalletConnected")}
						</div>
					)}
				</div>
			</div>

			<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
				<div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						{t("sections.linkedAccounts")}
					</p>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => void loadLinkedAccounts()}
						disabled={accountsLoading}
						className="h-7 px-2"
					>
						<RefreshCw
							className={`h-3.5 w-3.5 ${accountsLoading ? "animate-spin" : ""}`}
						/>
					</Button>
				</div>
				<div className="p-6 space-y-4">
					<div className="flex flex-wrap gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => void upsertOAuthProvider("google")}
							disabled={pendingProvider !== null}
						>
							<Link2 className="h-3.5 w-3.5 mr-1.5" />
							{isLinked("google")
								? t("actions.relinkGoogle")
								: t("actions.linkGoogle")}
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => void upsertOAuthProvider("github")}
							disabled={pendingProvider !== null}
						>
							<Link2 className="h-3.5 w-3.5 mr-1.5" />
							{isLinked("github")
								? t("actions.relinkGithub")
								: t("actions.linkGithub")}
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => void linkCurrentWallet()}
							disabled={pendingProvider !== null || !walletAddress}
						>
							<Link2 className="h-3.5 w-3.5 mr-1.5" />
							{isLinked("wallet")
								? t("actions.relinkWallet")
								: t("actions.linkCurrentWallet")}
						</Button>
					</div>

					{accountsLoading ? (
						<div className="text-sm text-muted-foreground">
							{t("loading.linkedAccounts")}
						</div>
					) : accounts.length === 0 ? (
						<div className="text-sm text-muted-foreground">
							{t("empty.noLinkedAccounts")}
						</div>
					) : (
						<div className="space-y-2">
							{accounts.map((account) => {
								const providerLabel = t(`providers.${account.provider}`);

								return (
									<div
										key={`${account.provider}-${account.identifier}`}
										className="flex items-center justify-between rounded-xl border border-border/50 px-3 py-2"
									>
										<div className="min-w-0">
											<p className="text-sm font-medium">{providerLabel}</p>
											<p className="text-xs text-muted-foreground truncate">
												{account.identifier}
											</p>
											<p className="text-[10px] text-muted-foreground mt-0.5">
												{t("linkedAtLabel")}{" "}
												{new Date(account.linkedAt).toLocaleDateString()}
											</p>
										</div>
										<div className="flex items-center gap-2">
											{(account.provider === "google" ||
												account.provider === "github") && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() =>
														void upsertOAuthProvider(
															account.provider as "google" | "github",
															true
														)
													}
													disabled={pendingProvider !== null}
												>
													<RefreshCw className="h-3.5 w-3.5 mr-1.5" />
													{t("actions.reauth")}
												</Button>
											)}
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													void unlinkProvider(account.provider)
												}
												disabled={pendingProvider !== null}
											>
												<Unlink className="h-3.5 w-3.5 mr-1.5" />
												{t("actions.unlink")}
											</Button>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>

			<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
				<div className="px-6 py-4 border-b border-border/40">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						{t("sections.preferences")}
					</p>
				</div>
				<div className="p-6 space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">{t("autoConnect.title")}</p>
							<p className="text-xs text-muted-foreground">
								{t("autoConnect.description")}
							</p>
						</div>
						<Switch checked={autoConnect} onCheckedChange={setAutoConnect} />
					</div>
				</div>
			</div>

			<div className="flex justify-end">
				<Button size="sm" onClick={handleSave} disabled={saving}>
					{saving ? t("actions.saving") : t("actions.saveChanges")}
				</Button>
			</div>
		</div>
	);
}
