import { Connection, clusterApiUrl } from "@solana/web3.js";

export function createConnection(cluster: "devnet" | "mainnet-beta" = "devnet"): Connection {
	const endpoint =
		cluster === "mainnet-beta" ? clusterApiUrl("mainnet-beta") : clusterApiUrl("devnet");
	return new Connection(endpoint, "confirmed");
}
