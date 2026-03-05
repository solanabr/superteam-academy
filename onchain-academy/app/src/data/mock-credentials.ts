import type { Credential } from "@/types/domain";

export const MOCK_CREDENTIALS: Credential[] = [
  {
    credentialId: "demo-cred-anchor-core-patterns",
    title: "Anchor Core Patterns",
    track: "Solana Core Engineering",
    level: 3,
    coursesCompleted: 2,
    totalXp: 8_750,
    mintAddress: "6xZjMqBs9PnTrKaVcHeYiGfWkDqNoEiLdBzFkApJvRk3J",
    metadataUri:
      "https://arweave.net/anchorcore111111111111111111111111111111111",
    explorerUrl:
      "https://explorer.solana.com/address/6xZjMqBs9PnTrKaVcHeYiGfWkDqNoEiLdBzFkApJvRk3J?cluster=devnet",
    verified: true,
    source: "helius",
  },
  {
    credentialId: "demo-cred-solana-fundamentals",
    title: "Solana Fundamentals",
    track: "Core",
    level: 3,
    coursesCompleted: 1,
    totalXp: 1200,
    mintAddress: "8xFn3K2mPqR7vZdYbWsTuLeQaC6NhJpXoYkEiGfDzBrV",
    metadataUri:
      "https://arweave.net/abc123def456ghi789jkl012mno345pqr678stu901vwx",
    explorerUrl:
      "https://explorer.solana.com/address/8xFn3K2mPqR7vZdYbWsTuLeQaC6NhJpXoYkEiGfDzBrV?cluster=devnet",
    verified: true,
    source: "helius",
  },
  {
    credentialId: "demo-cred-anchor-development",
    title: "Anchor Development",
    track: "Programs",
    level: 5,
    coursesCompleted: 3,
    totalXp: 3750,
    mintAddress: "5pQwMdNrYsTuKaVbXcLeHiGfZjBnCqRoEiDzFkApJvSm",
    metadataUri:
      "https://arweave.net/xyz789uvw456rst123opq890mno567jkl234ghi901def",
    explorerUrl:
      "https://explorer.solana.com/address/5pQwMdNrYsTuKaVbXcLeHiGfZjBnCqRoEiDzFkApJvSm?cluster=devnet",
    verified: true,
    source: "helius",
  },
  {
    credentialId: "demo-cred-token2022",
    title: "Token-2022 Deep Dive",
    track: "DeFi",
    level: 4,
    coursesCompleted: 2,
    totalXp: 2400,
    mintAddress: "3mLkNpQvRsUaWbYcTeHiGfXjBzDqCoEiFdZkApJvSn8r",
    metadataUri: null,
    explorerUrl:
      "https://explorer.solana.com/address/3mLkNpQvRsUaWbYcTeHiGfXjBzDqCoEiFdZkApJvSn8r?cluster=devnet",
    verified: false,
    source: "helius",
  },
];

export function findMockCredential(id: string): Credential | undefined {
  return MOCK_CREDENTIALS.find(
    (c) => c.credentialId === id || c.mintAddress === id,
  );
}
