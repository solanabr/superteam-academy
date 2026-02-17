"use client";

import { useState } from "react";
import { Wallet, Plus, Trash2, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface ConnectedWallet {
	id: string;
	address: string;
	name: string;
	type: "solana" | "ethereum";
	balance: string;
	isPrimary: boolean;
}

function truncateAddress(address: string) {
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletSettings() {
	const { toast } = useToast();
	const [saving, setSaving] = useState(false);
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [newAddress, setNewAddress] = useState("");
	const [autoConnect, setAutoConnect] = useState(true);
	const [wallets, setWallets] = useState<ConnectedWallet[]>([
		{
			id: "1",
			address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAs",
			name: "Phantom",
			type: "solana",
			balance: "1.234 SOL",
			isPrimary: true,
		},
		{
			id: "2",
			address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
			name: "MetaMask",
			type: "ethereum",
			balance: "0.056 ETH",
			isPrimary: false,
		},
	]);

	const copyAddress = async (wallet: ConnectedWallet) => {
		await navigator.clipboard.writeText(wallet.address);
		setCopiedId(wallet.id);
		setTimeout(() => setCopiedId(null), 2000);
	};

	const addWallet = () => {
		if (!newAddress.trim()) return;
		const w: ConnectedWallet = {
			id: Date.now().toString(),
			address: newAddress,
			name: "New Wallet",
			type: newAddress.startsWith("0x") ? "ethereum" : "solana",
			balance: "0.000",
			isPrimary: false,
		};
		setWallets((prev) => [...prev, w]);
		setNewAddress("");
		toast({ title: "Wallet connected" });
	};

	const removeWallet = (id: string) => {
		setWallets((prev) => prev.filter((w) => w.id !== id));
		toast({ title: "Wallet disconnected" });
	};

	const setPrimary = (id: string) => {
		setWallets((prev) => prev.map((w) => ({ ...w, isPrimary: w.id === id })));
	};

	const handleSave = async () => {
		setSaving(true);
		await new Promise((r) => setTimeout(r, 800));
		setSaving(false);
		toast({ title: "Wallet settings saved" });
	};

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
				<div className="px-6 py-4 border-b border-border/40">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						Connected wallets
					</p>
				</div>
				<div className="divide-y divide-border/40">
					{wallets.map((wallet) => (
						<div key={wallet.id} className="px-6 py-4 flex items-center gap-4">
							<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
								<Wallet className="h-4 w-4 text-primary" />
							</div>

							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<p className="text-sm font-medium">{wallet.name}</p>
									{wallet.isPrimary && (
										<span className="text-[10px] font-medium uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
											Primary
										</span>
									)}
									<span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
										{wallet.type}
									</span>
								</div>
								<div className="flex items-center gap-2 mt-0.5">
									<code className="text-xs text-muted-foreground font-mono">
										{truncateAddress(wallet.address)}
									</code>
									<button
										type="button"
										onClick={() => copyAddress(wallet)}
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										{copiedId === wallet.id ? (
											<Check className="h-3 w-3 text-green-500" />
										) : (
											<Copy className="h-3 w-3" />
										)}
									</button>
									<span className="text-xs text-muted-foreground">
										{wallet.balance}
									</span>
								</div>
							</div>

							<div className="flex items-center gap-1 shrink-0">
								{!wallet.isPrimary && (
									<Button
										variant="ghost"
										size="sm"
										className="h-8 text-xs"
										onClick={() => setPrimary(wallet.id)}
									>
										Set primary
									</Button>
								)}
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 p-0"
									onClick={() =>
										window.open(
											`https://solscan.io/account/${wallet.address}`,
											"_blank",
											"noopener,noreferrer"
										)
									}
								>
									<ExternalLink className="h-3.5 w-3.5" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 p-0 text-destructive hover:text-destructive"
									onClick={() => removeWallet(wallet.id)}
								>
									<Trash2 className="h-3.5 w-3.5" />
								</Button>
							</div>
						</div>
					))}

					{wallets.length === 0 && (
						<div className="px-6 py-8 text-center text-sm text-muted-foreground">
							No wallets connected yet.
						</div>
					)}
				</div>
			</div>

			<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
				<div className="px-6 py-4 border-b border-border/40">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						Connect new wallet
					</p>
				</div>
				<div className="p-6">
					<div className="flex gap-2">
						<Input
							placeholder="Enter wallet address"
							value={newAddress}
							onChange={(e) => setNewAddress(e.target.value)}
							className="h-9 text-sm"
						/>
						<Button size="sm" onClick={addWallet} className="shrink-0">
							<Plus className="h-3.5 w-3.5 mr-1.5" />
							Connect
						</Button>
					</div>
					<p className="text-xs text-muted-foreground mt-2">
						Supports Solana and Ethereum wallet addresses.
					</p>
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
