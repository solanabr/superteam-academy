const CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER ?? "devnet") as
  | "mainnet-beta"
  | "devnet"
  | "testnet";

export function solanaExplorerUrl(
  addressOrSig: string,
  type: "address" | "tx" = "address",
): string {
  const cluster = CLUSTER !== "mainnet-beta" ? `?cluster=${CLUSTER}` : "";
  return `https://explorer.solana.com/${type}/${addressOrSig}${cluster}`;
}
