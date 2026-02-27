import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

export const WALLET_CONFIG = {
	network: WalletAdapterNetwork.Devnet,
	autoConnect: true,
	localStorageKey: "superteam-academy-wallet",
} as const;

export const SUPPORTED_WALLETS = ["Phantom", "Solflare", "Alpha"] as const;
