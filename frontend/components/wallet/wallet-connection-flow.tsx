"use client";

import { useState, useEffect } from "react";
import {
    Wallet,
    Check,
    AlertCircle,
    ExternalLink,
    Flame,
    Backpack,
    ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

interface WalletConnectionFlowProps {
	onSuccess?: (address: string) => void;
	onError?: (error: string) => void;
	required?: boolean;
}

const SUPPORTED_WALLETS = [
	{
		name: "Phantom",
		icon: "wallet",
		description: "Popular Solana wallet with mobile app",
		url: "https://phantom.app/",
	},
	{
		name: "Solflare",
		icon: "flame",
		description: "Secure wallet with hardware wallet support",
		url: "https://solflare.com/",
	},
	{
		name: "Backpack",
		icon: "backpack",
		description: "Multi-chain wallet with DeFi features",
		url: "https://backpack.app/",
	},
	{
		name: "Trust Wallet",
		icon: "shield",
		description: "Mobile-first wallet with web3 support",
		url: "https://trustwallet.com/",
	},
];

const WALLET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
	wallet: Wallet,
	flame: Flame,
	backpack: Backpack,
	shield: ShieldCheck,
};

export function WalletConnectionFlow({
	onSuccess,
	onError,
	required = false,
}: WalletConnectionFlowProps) {
	const t = useTranslations("wallet");
	const { connected, connecting, publicKey, disconnect, select: _select } = useWallet();
	const { setVisible } = useWalletModal();
	const { toast } = useToast();
	const [isConnecting, setIsConnecting] = useState(false);
	const [connectionError, setConnectionError] = useState<string | null>(null);

	useEffect(() => {
		if (connected && publicKey) {
			const address = publicKey.toString();
			toast({
				title: t("connected"),
				description: t("connectedDesc", {
					address: `${address.slice(0, 4)}...${address.slice(-4)}`,
				}),
			});
			onSuccess?.(address);
			setConnectionError(null);
		}
	}, [connected, publicKey, onSuccess, toast, t]);

	const handleConnect = async () => {
		try {
			setIsConnecting(true);
			setConnectionError(null);
			setVisible(true);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : t("connectionFailed");
			setConnectionError(errorMessage);
			onError?.(errorMessage);
			toast({
				title: t("connectionFailed"),
				description: errorMessage,
				variant: "destructive",
			});
		} finally {
			setIsConnecting(false);
		}
	};

	const handleDisconnect = async () => {
		try {
			await disconnect();
			toast({
				title: t("disconnected"),
				description: t("disconnectedDesc"),
			});
		} catch (_error) {
			toast({
				title: t("disconnectFailed"),
				description: t("disconnectFailedDesc"),
				variant: "destructive",
			});
		}
	};

	if (connected && publicKey) {
		const address = publicKey.toString();
		return (
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Check className="h-5 w-5 text-green-600" />
						{t("walletConnected")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between p-3 bg-muted rounded-lg">
						<div className="flex items-center gap-3">
							<Wallet className="h-8 w-8" />
							<div>
								<p className="font-medium">{t("connectedWallet")}</p>
								<p className="text-sm text-muted-foreground font-mono">
									{address.slice(0, 8)}...{address.slice(-8)}
								</p>
							</div>
						</div>
						<Badge variant="secondary" className="text-green-600">
							{t("connected")}
						</Badge>
					</div>

					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => navigator.clipboard.writeText(address)}
						>
							{t("copyAddress")}
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								window.open(`https://solscan.io/account/${address}`, "_blank")
							}
						>
							<ExternalLink className="h-4 w-4 mr-1" />
							{t("viewOnExplorer")}
						</Button>
						<Button variant="outline" size="sm" onClick={handleDisconnect}>
							{t("disconnect")}
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Wallet className="h-5 w-5" />
					{t("connectWallet")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{required && (
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{t("walletRequired")}</AlertDescription>
					</Alert>
				)}

				{connectionError && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{connectionError}</AlertDescription>
					</Alert>
				)}

				<div className="text-center space-y-4">
					<p className="text-muted-foreground">{t("connectDescription")}</p>

					<Button
						onClick={handleConnect}
						disabled={connecting || isConnecting}
						className="w-full"
						size="lg"
					>
						<Wallet className="h-4 w-4 mr-2" />
						{connecting || isConnecting ? t("connecting") : t("connectWallet")}
					</Button>
				</div>

				<div className="space-y-3">
					<h4 className="text-sm font-medium">{t("supportedWallets")}</h4>
					<div className="grid grid-cols-2 gap-2">
						{SUPPORTED_WALLETS.map((wallet) => (
							<div
								key={wallet.name}
								className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted cursor-pointer"
								onClick={() => window.open(wallet.url, "_blank")}
							>
								{(() => {
									const Icon = WALLET_ICONS[wallet.icon] || Wallet;
									return <Icon className="h-5 w-5" />;
								})()}
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate">{wallet.name}</p>
									<p className="text-xs text-muted-foreground truncate">
										{wallet.description}
									</p>
								</div>
								<ExternalLink className="h-3 w-3 text-muted-foreground" />
							</div>
						))}
					</div>
				</div>

				<div className="text-xs text-muted-foreground text-center">{t("walletHelp")}</div>
			</CardContent>
		</Card>
	);
}
