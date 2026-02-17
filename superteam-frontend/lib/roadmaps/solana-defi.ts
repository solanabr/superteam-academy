import type { RoadmapDef } from "./types";

export const solanaDefi: RoadmapDef = {
  slug: "solana-defi",
  title: "Solana DeFi",
  description:
    "Understand and build decentralized finance protocols on Solana.",
  sections: [
    {
      id: "defi-fund",
      title: "DeFi Fundamentals",
      description:
        "Core concepts that underpin all decentralized finance protocols.",
      resources: [
        {
          type: "docs",
          title: "Solana Cookbook",
          url: "https://solanacookbook.com",
        },
        {
          type: "docs",
          title: "Solana Token Documentation",
          url: "https://solana.com/docs/core/tokens",
        },
      ],
      left: [
        {
          id: "defi-core",
          label: "Core Concepts",
          description:
            "Foundational ideas like liquidity, yield generation, and impermanent loss that apply across all DeFi protocols.",
          resources: [
            {
              type: "article",
              title: "Solana Cookbook - DeFi Basics",
              url: "https://solanacookbook.com",
            },
          ],
          children: [
            { id: "dc-liq", label: "Liquidity" },
            { id: "dc-yield", label: "Yield" },
            { id: "dc-il", label: "Impermanent Loss" },
          ],
        },
      ],
      right: [
        {
          id: "defi-tokens",
          label: "Token Standards",
          description:
            "SPL Token and Token-2022 standards used to represent fungible assets on Solana.",
          resources: [
            {
              type: "docs",
              title: "SPL Token Documentation",
              url: "https://solana.com/docs/core/tokens",
            },
            {
              type: "docs",
              title: "Token-2022 Extension Guide",
              url: "https://spl.solana.com/token-2022",
            },
          ],
          children: [
            { id: "dt-spl", label: "SPL Token" },
            { id: "dt-t22", label: "Token-2022" },
            { id: "dt-wsol", label: "Wrapped SOL" },
          ],
        },
      ],
    },
    {
      id: "dexs",
      title: "DEXs & AMMs",
      description:
        "Decentralized exchanges and automated market makers that enable permissionless trading on Solana.",
      resources: [
        {
          type: "docs",
          title: "Jupiter Documentation",
          url: "https://docs.jupiter.ag",
        },
      ],
      left: [
        {
          id: "amm-how",
          label: "How AMMs Work",
          description:
            "The mechanics behind automated market makers including pricing curves, concentrated liquidity, and on-chain order books.",
          resources: [
            {
              type: "docs",
              title: "Orca Concentrated Liquidity Docs",
              url: "https://docs.orca.so",
            },
          ],
          children: [
            { id: "amm-cp", label: "Constant Product" },
            { id: "amm-cl", label: "Concentrated Liquidity" },
            { id: "amm-ob", label: "Order Books (CLOB)" },
          ],
        },
      ],
      right: [
        {
          id: "sol-dex",
          label: "Solana DEXs",
          description:
            "Major decentralized exchanges on Solana including aggregators and native AMMs.",
          resources: [
            {
              type: "docs",
              title: "Jupiter Docs",
              url: "https://docs.jupiter.ag",
            },
            {
              type: "docs",
              title: "Raydium Docs",
              url: "https://docs.raydium.io",
            },
            {
              type: "docs",
              title: "Orca Docs",
              url: "https://docs.orca.so",
            },
          ],
          children: [
            { id: "dex-jup", label: "Jupiter" },
            { id: "dex-ray", label: "Raydium" },
            { id: "dex-orca", label: "Orca" },
          ],
        },
      ],
    },
    {
      id: "lending",
      title: "Lending & Borrowing",
      description:
        "Protocols that enable overcollateralized lending and borrowing of digital assets.",
      resources: [
        {
          type: "docs",
          title: "Marginfi Documentation",
          url: "https://docs.marginfi.com",
        },
        {
          type: "docs",
          title: "Kamino Documentation",
          url: "https://docs.kamino.finance",
        },
      ],
      left: [
        {
          id: "lend-design",
          label: "Protocol Design",
          description:
            "How lending protocols handle collateral ratios, variable interest rates, and liquidation mechanisms.",
          resources: [
            {
              type: "article",
              title: "Solana Cookbook",
              url: "https://solanacookbook.com",
            },
          ],
          children: [
            { id: "ld-coll", label: "Collateralization" },
            { id: "ld-ir", label: "Interest Rates" },
            { id: "ld-liq", label: "Liquidations" },
          ],
        },
      ],
      right: [
        {
          id: "lend-proto",
          label: "Solana Protocols",
          description:
            "Leading lending and borrowing platforms built on Solana.",
          resources: [
            {
              type: "docs",
              title: "Marginfi Docs",
              url: "https://docs.marginfi.com",
            },
            {
              type: "docs",
              title: "Kamino Finance Docs",
              url: "https://docs.kamino.finance",
            },
          ],
          children: [
            { id: "lp-mfi", label: "Marginfi" },
            { id: "lp-kam", label: "Kamino" },
            { id: "lp-sol", label: "Solend" },
          ],
        },
      ],
    },
    {
      id: "oracles",
      title: "Oracles & Price Feeds",
      description:
        "External data providers that deliver real-world price information to on-chain programs.",
      resources: [
        {
          type: "docs",
          title: "Pyth Network Documentation",
          url: "https://docs.pyth.network",
        },
        {
          type: "docs",
          title: "Switchboard Documentation",
          url: "https://docs.switchboard.xyz",
        },
      ],
      left: [
        {
          id: "oracle-design",
          label: "Oracle Design",
          description:
            "Architectural patterns for price feeds including push vs pull models, confidence intervals, and staleness protection.",
          resources: [
            {
              type: "docs",
              title: "Pyth Network - How It Works",
              url: "https://docs.pyth.network",
            },
          ],
          children: [
            { id: "od-push", label: "Push vs Pull" },
            { id: "od-conf", label: "Confidence Intervals" },
            { id: "od-stale", label: "Staleness Checks" },
          ],
        },
      ],
      right: [
        {
          id: "oracle-prov",
          label: "Providers",
          description:
            "Oracle networks available on Solana for sourcing reliable off-chain data.",
          resources: [
            {
              type: "docs",
              title: "Pyth Network Docs",
              url: "https://docs.pyth.network",
            },
            {
              type: "docs",
              title: "Switchboard Docs",
              url: "https://docs.switchboard.xyz",
            },
          ],
          children: [
            { id: "op-pyth", label: "Pyth Network" },
            { id: "op-switch", label: "Switchboard" },
            { id: "op-chain", label: "Chainlink" },
          ],
        },
      ],
    },
    {
      id: "yield",
      title: "Yield Strategies",
      description:
        "Methods for earning yield on Solana through staking, liquidity provision, and vault automation.",
      resources: [
        {
          type: "docs",
          title: "Marinade Documentation",
          url: "https://docs.marinade.finance",
        },
        {
          type: "docs",
          title: "Jito Documentation",
          url: "https://docs.jito.network",
        },
      ],
      left: [
        {
          id: "yield-strat",
          label: "Strategies",
          description:
            "Common yield-generating strategies including liquid staking, LP farming, and automated vaults.",
          resources: [
            {
              type: "docs",
              title: "Marinade Staking Guide",
              url: "https://docs.marinade.finance",
            },
          ],
          children: [
            { id: "ys-stake", label: "Staking SOL" },
            { id: "ys-lp", label: "LP Farming" },
            { id: "ys-vault", label: "Vault Strategies" },
          ],
        },
      ],
      right: [
        {
          id: "yield-proto",
          label: "Protocols",
          description:
            "Solana protocols that offer liquid staking and yield optimization.",
          resources: [
            {
              type: "docs",
              title: "Marinade Finance Docs",
              url: "https://docs.marinade.finance",
            },
            {
              type: "docs",
              title: "Jito Network Docs",
              url: "https://docs.jito.network",
            },
          ],
          children: [
            { id: "yp-mari", label: "Marinade" },
            { id: "yp-jito", label: "Jito" },
            { id: "yp-sanc", label: "Sanctum" },
          ],
        },
      ],
    },
    {
      id: "stablecoins",
      title: "Stablecoins & Payments",
      description: "Stable-value tokens and payment infrastructure on Solana.",
      resources: [
        {
          type: "docs",
          title: "Solana Pay Documentation",
          url: "https://docs.solanapay.com",
        },
      ],
      left: [
        {
          id: "stable-types",
          label: "Stablecoin Types",
          description:
            "Different stablecoin mechanisms including fiat-backed, crypto-backed, and algorithmic designs.",
          resources: [
            {
              type: "docs",
              title: "Solana Token Documentation",
              url: "https://solana.com/docs/core/tokens",
            },
          ],
          children: [
            { id: "st-usdc", label: "USDC" },
            { id: "st-usdt", label: "USDT" },
            { id: "st-algo", label: "Algorithmic" },
          ],
        },
      ],
      right: [
        {
          id: "payments",
          label: "Payments",
          description:
            "Tools and protocols for sending payments, processing transactions, and streaming tokens on Solana.",
          resources: [
            {
              type: "docs",
              title: "Solana Pay Docs",
              url: "https://docs.solanapay.com",
            },
            {
              type: "docs",
              title: "SPL Token Documentation",
              url: "https://solana.com/docs/core/tokens",
            },
          ],
          children: [
            { id: "pay-sp", label: "Solana Pay" },
            { id: "pay-xfer", label: "Token Transfers" },
            { id: "pay-stream", label: "Streaming Payments" },
          ],
        },
      ],
    },
    {
      id: "adv-defi",
      title: "Advanced DeFi",
      description:
        "MEV extraction, arbitrage strategies, and derivative instruments on Solana.",
      resources: [
        {
          type: "docs",
          title: "Jito Network Documentation",
          url: "https://docs.jito.network",
        },
      ],
      left: [
        {
          id: "mev",
          label: "MEV & Arbitrage",
          description:
            "Maximal extractable value on Solana including Jito bundles, sandwich attack prevention, and backrunning.",
          resources: [
            {
              type: "docs",
              title: "Jito MEV Docs",
              url: "https://docs.jito.network",
            },
          ],
          children: [
            { id: "mev-jito", label: "Jito MEV" },
            { id: "mev-sand", label: "Sandwich Protection" },
            { id: "mev-back", label: "Backrunning" },
          ],
        },
      ],
      right: [
        {
          id: "deriv",
          label: "Derivatives",
          description:
            "On-chain derivative products including perpetual futures, options protocols, and prediction markets.",
          resources: [
            {
              type: "article",
              title: "Solana DeFi Ecosystem Overview",
              url: "https://solanacookbook.com",
            },
          ],
          children: [
            { id: "der-perp", label: "Perpetuals" },
            { id: "der-opt", label: "Options" },
            { id: "der-pred", label: "Prediction Markets" },
          ],
        },
      ],
    },
    {
      id: "risk-sec",
      title: "Risk & Security",
      description:
        "Identifying, assessing, and mitigating risks in DeFi protocols.",
      resources: [
        {
          type: "article",
          title: "Solana Security Best Practices",
          url: "https://solanacookbook.com",
        },
      ],
      left: [
        {
          id: "risk",
          label: "Risk Assessment",
          description:
            "Evaluating smart contract, oracle, and liquidity risks before interacting with DeFi protocols.",
          resources: [
            {
              type: "article",
              title: "Solana Cookbook - Security",
              url: "https://solanacookbook.com",
            },
          ],
          children: [
            { id: "risk-sc", label: "Smart Contract Risk" },
            { id: "risk-oracle", label: "Oracle Risk" },
            { id: "risk-liq", label: "Liquidity Risk" },
          ],
        },
      ],
      right: [
        {
          id: "defi-bp",
          label: "Best Practices",
          description:
            "Security practices for DeFi including audits, bug bounty programs, and on-chain insurance.",
          resources: [
            {
              type: "article",
              title: "Solana Security Best Practices",
              url: "https://solanacookbook.com",
            },
          ],
          children: [
            { id: "bp-audit", label: "Audits" },
            { id: "bp-bounty", label: "Bug Bounties" },
            { id: "bp-ins", label: "Insurance" },
          ],
        },
      ],
    },
  ],
};
