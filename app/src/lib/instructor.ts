/**
 * Verifica se a carteira possui NFT de instrutor (permissão para administrar cursos).
 * Em produção: checar posse do cNFT de instrutor na chain (ex.: Metaplex, Helius).
 * Para teste: use NEXT_PUBLIC_INSTRUCTOR_WALLETS com endereços separados por vírgula.
 */
export function hasInstructorNft(walletAddress: string | null): boolean {
  if (!walletAddress) return false;
  const allowed =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_INSTRUCTOR_WALLETS
      ? process.env.NEXT_PUBLIC_INSTRUCTOR_WALLETS.split(",").map((s) =>
          s.trim().toLowerCase(),
        )
      : [];
  return allowed.includes(walletAddress.toLowerCase());
}
