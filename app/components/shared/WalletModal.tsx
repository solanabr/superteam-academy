/**
 * @fileoverview Wallet selection and connection modal.
 * Lists available Solana wallet adapters and handles the selection process.
 */
"use client";

import { WalletName } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { FC } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export interface WalletModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * Modal dialog for selecting a Solana wallet to connect.
 * Features auto-detection for installed browser wallets.
 */
export const WalletModal: FC<WalletModalProps> = ({ open, onOpenChange }) => {
	const { wallets, select } = useWallet();
	const t = useTranslations("Wallet");

	const handleWalletClick = (walletName: WalletName) => {
		select(walletName);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md bg-bg-base border-ink-secondary/20 dark:border-border">
				<DialogHeader>
					<DialogTitle className="text-center font-bold uppercase tracking-widest text-ink-primary">
						{t("title")}
					</DialogTitle>
					<DialogDescription className="sr-only">
						Select a wallet to connect to Superteam Academy.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					{wallets.map((wallet) => (
						<Button
							key={wallet.adapter.name}
							variant="outline"
							className="group w-full justify-start gap-4 h-14 rounded-none border border-ink-secondary/20 dark:border-border bg-transparent text-ink-primary hover:bg-ink-primary/5 hover:text-ink-primary hover:border-ink-primary/50 transition-all font-mono uppercase text-sm"
							onClick={() => handleWalletClick(wallet.adapter.name)}
						>
							<Image
								src={wallet.adapter.icon}
								alt={wallet.adapter.name}
								width={24}
								height={24}
								className="w-6 h-6"
								unoptimized
							/>
							{wallet.adapter.name}
							{wallet.readyState === "Installed" && (
								<span className="ml-auto text-[10px] text-ink-secondary bg-ink-secondary/10 px-2 py-0.5 rounded-full group-hover:bg-ink-primary/10 group-hover:text-ink-primary transition-colors">
									{t("detected")}
								</span>
							)}
						</Button>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
};
