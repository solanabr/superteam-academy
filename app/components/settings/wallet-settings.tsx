"use client";

import { useState, useEffect } from "react";
import { Wallet, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useSettings } from "@/hooks/use-settings";

function truncateAddress(address: string) {
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletSettings() {
	const { toast } = useToast();
	const { wallet } = useAuth();
	const { data, save } = useSettings();
	const [saving, setSaving] = useState(false);
	const [copied, setCopied] = useState(false);
	const [autoConnect, setAutoConnect] = useState(true);

	useEffect(() => {
		if (typeof data?.settings?.wallet?.autoConnect === "boolean") {
			setAutoConnect(data.settings.wallet.autoConnect);
		}
	}, [data]);

	const walletAddress = wallet.publicKey?.toBase58() ?? null;
	const walletName = wallet.wallet?.adapter.name ?? "Unknown";

	const copyAddress = async () => {
		if (!walletAddress) return;
		await navigator.clipboard.writeText(walletAddress);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			await save({ settings: { wallet: { autoConnect } } });
			toast({ title: "Wallet settings saved" });
		} catch {
			toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
				<div className="px-6 py-4 border-b border-border/40">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						Connected wallet
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
										Primary
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
							No wallet connected. Connect a wallet to manage it here.
						</div>
					)}
				</div>
			</div>

			<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
				<div className="px-6 py-4 border-b border-border/40">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						Preferences
					</p>
				</div>
				<div className="p-6 space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">Auto-connect</p>
							<p className="text-xs text-muted-foreground">
								Automatically connect your primary wallet on login
							</p>
						</div>
						<Switch checked={autoConnect} onCheckedChange={setAutoConnect} />
					</div>
				</div>
			</div>

			<div className="flex justify-end">
				<Button size="sm" onClick={handleSave} disabled={saving}>
					{saving ? "Saving..." : "Save changes"}
				</Button>
			</div>
		</div>
	);
}
