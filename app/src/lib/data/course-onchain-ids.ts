const defaultCourseOnChainIds: Record<string, string> = {
  // Devnet currently has `solana-mock-test` provisioned; keep fundamentals enrollable by default.
  "solana-fundamentals": "solana-mock-test",
  "anchor-development": "anchor-development",
  "solana-frontend": "solana-frontend",
  "defi-on-solana": "defi-on-solana",
  "solana-security": "solana-security",
  "token-engineering": "token-engineering",
  "solana-mobile": "solana-mobile",
  "solana-testing": "solana-testing",
  "solana-indexing": "solana-indexing",
  "solana-payments": "solana-payments",
  "solana-nft-compression": "solana-nft-compression",
  "solana-governance-multisig": "solana-governance-multisig",
  "solana-performance": "solana-performance",
  "defi-swap-aggregator": "defi-swap-aggregator",
  "defi-clmm-liquidity": "defi-clmm-liquidity",
  "defi-lending-risk": "defi-lending-risk",
  "defi-perps-risk-console": "defi-perps-risk-console",
  "defi-tx-optimizer": "defi-tx-optimizer",
  "solana-mobile-signing": "solana-mobile-signing",
  "solana-pay-commerce": "solana-pay-commerce",
  "wallet-ux-engineering": "wallet-ux-engineering",
  "sign-in-with-solana": "sign-in-with-solana",
  "priority-fees-compute-budget": "priority-fees-compute-budget",
  "bundles-atomicity": "bundles-atomicity",
  "mempool-ux-defense": "mempool-ux-defense",
  "indexing-webhooks-pipelines": "indexing-webhooks-pipelines",
  "rpc-reliability-latency": "rpc-reliability-latency",
  "rust-data-layout-borsh": "rust-data-layout-borsh",
  "rust-errors-invariants": "rust-errors-invariants",
  "rust-perf-onchain-thinking": "rust-perf-onchain-thinking",
  "rust-async-indexer-pipeline": "rust-async-indexer-pipeline",
  "rust-proc-macros-codegen-safety": "rust-proc-macros-codegen-safety",
  "anchor-upgrades-migrations": "anchor-upgrades-migrations",
};

function parseOnChainCourseIdOverrides(): Record<string, string> {
  const rawValue =
    process.env.COURSE_ONCHAIN_IDS_JSON ||
    process.env.NEXT_PUBLIC_COURSE_ONCHAIN_IDS_JSON ||
    "";

  if (!rawValue.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] =>
          typeof entry[0] === "string" && typeof entry[1] === "string"
      )
    );
  } catch {
    return {};
  }
}

export const courseOnChainIds: Record<string, string> = {
  ...defaultCourseOnChainIds,
  ...parseOnChainCourseIdOverrides(),
};

export function getOnChainCourseId(courseSlug: string): string | null {
  return courseOnChainIds[courseSlug] ?? null;
}
