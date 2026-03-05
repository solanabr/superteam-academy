/**
 * Verifica se a carteira possui privilégios de administrador.
 * Em produção: checar posse do cNFT de admin na chain (ex.: Metaplex, Helius).
 * Para teste: use NEXT_PUBLIC_ADMIN_WALLETS com endereços separados por vírgula.
 */
export function isAdminWallet(walletAddress: string | null): boolean {
  if (!walletAddress) return false;
  const allowed =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_ADMIN_WALLETS
      ? process.env.NEXT_PUBLIC_ADMIN_WALLETS.split(",").map((s) =>
          s.trim().toLowerCase(),
        )
      : [];
  return allowed.includes(walletAddress.toLowerCase());
}
