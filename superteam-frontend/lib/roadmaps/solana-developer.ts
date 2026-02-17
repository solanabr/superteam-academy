import type { RoadmapDef } from "./types";

export const solanaDeveloper: RoadmapDef = {
  slug: "solana-developer",
  title: "Solana Developer",
  description:
    "From Rust basics to deploying production programs on Solana mainnet.",
  sections: [
    {
      id: "prereqs",
      title: "Prerequisites",
      description:
        "Set up your Rust toolchain and Solana development environment before writing any on-chain code.",
      resources: [
        {
          type: "docs",
          title: "The Rust Programming Language",
          url: "https://doc.rust-lang.org/book/",
        },
        {
          type: "docs",
          title: "Solana Installation Guide",
          url: "https://solana.com/docs/intro/installation",
        },
      ],
      left: [
        {
          id: "rust",
          label: "Rust Basics",
          description:
            "Learn Rust fundamentals including ownership, traits, and error handling — the foundation for all Solana program development.",
          resources: [
            {
              type: "docs",
              title: "The Rust Programming Language",
              url: "https://doc.rust-lang.org/book/",
            },
            {
              type: "course",
              title: "Rustlings Exercises",
              url: "https://github.com/rust-lang/rustlings",
            },
          ],
          children: [
            { id: "rust-own", label: "Ownership & Borrowing" },
            { id: "rust-traits", label: "Traits & Generics" },
            { id: "rust-err", label: "Error Handling" },
          ],
        },
      ],
      right: [
        {
          id: "devenv",
          label: "Dev Environment",
          description:
            "Install and configure VS Code, Solana CLI, and Anchor CLI for a productive Solana development workflow.",
          resources: [
            {
              type: "docs",
              title: "Solana Installation Guide",
              url: "https://solana.com/docs/intro/installation",
            },
            {
              type: "docs",
              title: "Anchor Framework Docs",
              url: "https://www.anchor-lang.com",
            },
          ],
          children: [
            { id: "devenv-vsc", label: "VS Code + rust-analyzer" },
            { id: "devenv-cli", label: "Solana CLI" },
            { id: "devenv-anchor", label: "Anchor CLI" },
          ],
        },
      ],
    },
    {
      id: "blockchain",
      title: "Blockchain Fundamentals",
      description:
        "Understand how Solana achieves high throughput and the core concepts that differentiate it from other blockchains.",
      resources: [
        {
          type: "docs",
          title: "Solana Documentation",
          url: "https://solana.com/docs",
        },
        {
          type: "article",
          title: "Solana Cookbook",
          url: "https://solanacookbook.com",
        },
      ],
      left: [
        {
          id: "how-solana",
          label: "How Solana Works",
          description:
            "Learn about Proof of History, Tower BFT consensus, and the networking innovations that power Solana's speed.",
          resources: [
            {
              type: "docs",
              title: "Solana Documentation",
              url: "https://solana.com/docs",
            },
            {
              type: "article",
              title: "Solana Cookbook",
              url: "https://solanacookbook.com",
            },
          ],
          children: [
            { id: "sol-poh", label: "Proof of History" },
            { id: "sol-tower", label: "Tower BFT" },
            { id: "sol-turbine", label: "Turbine & Gulf Stream" },
          ],
        },
      ],
      right: [
        {
          id: "key-concepts",
          label: "Key Concepts",
          description:
            "Grasp Solana's account model, transaction structure, and how programs differ from smart contracts on other chains.",
          resources: [
            {
              type: "docs",
              title: "Solana Core Concepts — Accounts",
              url: "https://solana.com/docs/core/accounts",
            },
            {
              type: "docs",
              title: "Solana Developer Guides",
              url: "https://solana.com/developers/guides",
            },
          ],
          children: [
            { id: "kc-accounts", label: "Account Model" },
            { id: "kc-tx", label: "Transactions & Instructions" },
            { id: "kc-programs", label: "Programs vs Smart Contracts" },
          ],
        },
      ],
    },
    {
      id: "first-program",
      title: "Your First Program",
      description:
        "Write, build, and deploy your first Solana program using either the Anchor framework or native Rust.",
      resources: [
        {
          type: "docs",
          title: "Anchor Framework Docs",
          url: "https://www.anchor-lang.com",
        },
        {
          type: "docs",
          title: "Solana Developer Guides",
          url: "https://solana.com/developers/guides",
        },
      ],
      left: [
        {
          id: "anchor",
          label: "Anchor Framework",
          description:
            "Use Anchor's macros and code generation to build Solana programs faster with built-in safety checks and IDL generation.",
          resources: [
            {
              type: "docs",
              title: "Anchor Framework Docs",
              url: "https://www.anchor-lang.com",
            },
            {
              type: "article",
              title: "Anchor GitHub Repository",
              url: "https://github.com/coral-xyz/anchor",
            },
            {
              type: "article",
              title: "Solana Cookbook",
              url: "https://solanacookbook.com",
            },
          ],
          children: [
            { id: "anc-struct", label: "Project Structure" },
            { id: "anc-macros", label: "Macros & Attributes" },
            { id: "anc-idl", label: "IDL Generation" },
          ],
        },
      ],
      right: [
        {
          id: "native",
          label: "Native Rust",
          description:
            "Build programs directly with the Solana SDK using the entrypoint macro, raw instruction processing, and Borsh serialization.",
          resources: [
            {
              type: "docs",
              title: "Solana Developer Guides",
              url: "https://solana.com/developers/guides",
            },
            {
              type: "docs",
              title: "The Rust Programming Language",
              url: "https://doc.rust-lang.org/book/",
            },
          ],
          children: [
            { id: "nat-entry", label: "entrypoint! Macro" },
            { id: "nat-proc", label: "process_instruction" },
            { id: "nat-borsh", label: "Borsh Serialization" },
          ],
        },
      ],
    },
    {
      id: "accounts-pdas",
      title: "Accounts & PDAs",
      description:
        "Master Solana's account model and Program Derived Addresses, the building blocks for all on-chain state management.",
      resources: [
        {
          type: "docs",
          title: "Solana Core Concepts — Accounts",
          url: "https://solana.com/docs/core/accounts",
        },
        {
          type: "docs",
          title: "Solana Core Concepts — PDAs",
          url: "https://solana.com/docs/core/pda",
        },
      ],
      left: [
        {
          id: "acc-types",
          label: "Account Types",
          description:
            "Understand the differences between data accounts, system accounts, and token accounts, and when to use each.",
          resources: [
            {
              type: "docs",
              title: "Solana Core Concepts — Accounts",
              url: "https://solana.com/docs/core/accounts",
            },
            {
              type: "article",
              title: "Solana Cookbook",
              url: "https://solanacookbook.com",
            },
          ],
          children: [
            { id: "acc-data", label: "Data Accounts" },
            { id: "acc-sys", label: "System Accounts" },
            { id: "acc-token", label: "Token Accounts" },
          ],
        },
      ],
      right: [
        {
          id: "pdas",
          label: "PDAs",
          description:
            "Learn how to derive deterministic addresses with seeds and bumps, enabling programs to own and sign for accounts.",
          resources: [
            {
              type: "docs",
              title: "Solana Core Concepts — PDAs",
              url: "https://solana.com/docs/core/pda",
            },
            {
              type: "docs",
              title: "Anchor Framework Docs",
              url: "https://www.anchor-lang.com",
            },
          ],
          children: [
            { id: "pda-seeds", label: "Seeds & Bumps" },
            { id: "pda-find", label: "findProgramAddress" },
            { id: "pda-canon", label: "Canonical Bumps" },
          ],
        },
      ],
    },
    {
      id: "cpis",
      title: "Cross-Program Invocations",
      description:
        "Call other programs from within your program to compose functionality across the Solana ecosystem.",
      resources: [
        {
          type: "docs",
          title: "Solana Core Concepts — CPIs",
          url: "https://solana.com/docs/core/cpi",
        },
        {
          type: "article",
          title: "Solana Cookbook",
          url: "https://solanacookbook.com",
        },
      ],
      left: [
        {
          id: "cpi-basics",
          label: "CPI Basics",
          description:
            "Understand the invoke and invoke_signed functions for calling other programs, including how PDA signers work across CPIs.",
          resources: [
            {
              type: "docs",
              title: "Solana Core Concepts — CPIs",
              url: "https://solana.com/docs/core/cpi",
            },
            {
              type: "docs",
              title: "Solana Developer Guides",
              url: "https://solana.com/developers/guides",
            },
          ],
          children: [
            { id: "cpi-invoke", label: "invoke" },
            { id: "cpi-signed", label: "invoke_signed" },
          ],
        },
      ],
      right: [
        {
          id: "cpi-common",
          label: "Common CPIs",
          description:
            "Learn the most frequently used CPIs: creating accounts via System Program, transferring tokens, and managing ATAs.",
          resources: [
            {
              type: "docs",
              title: "Solana Core Concepts — Tokens",
              url: "https://solana.com/docs/core/tokens",
            },
            {
              type: "article",
              title: "Solana Cookbook",
              url: "https://solanacookbook.com",
            },
            {
              type: "docs",
              title: "Solana Core Concepts — CPIs",
              url: "https://solana.com/docs/core/cpi",
            },
          ],
          children: [
            { id: "cpi-sys", label: "System Program" },
            { id: "cpi-tok", label: "Token Program" },
            { id: "cpi-ata", label: "Associated Token" },
          ],
        },
      ],
    },
    {
      id: "tokens",
      title: "Token Programs",
      description:
        "Create and manage fungible and non-fungible tokens using SPL Token and the newer Token-2022 program with extensions.",
      resources: [
        {
          type: "docs",
          title: "Solana Core Concepts — Tokens",
          url: "https://solana.com/docs/core/tokens",
        },
        {
          type: "docs",
          title: "Token-2022 Documentation",
          url: "https://spl.solana.com/token-2022",
        },
      ],
      left: [
        {
          id: "spl",
          label: "SPL Token",
          description:
            "Work with the original SPL Token program to mint, transfer, and burn fungible and non-fungible tokens.",
          resources: [
            {
              type: "docs",
              title: "Solana Core Concepts — Tokens",
              url: "https://solana.com/docs/core/tokens",
            },
            {
              type: "article",
              title: "Solana Cookbook",
              url: "https://solanacookbook.com",
            },
          ],
          children: [
            { id: "spl-mint", label: "Mint" },
            { id: "spl-xfer", label: "Transfer" },
            { id: "spl-burn", label: "Burn" },
          ],
        },
      ],
      right: [
        {
          id: "t22",
          label: "Token-2022",
          description:
            "Use Token-2022 extensions like NonTransferable, PermanentDelegate, and TokenMetadata for advanced token functionality.",
          resources: [
            {
              type: "docs",
              title: "Token-2022 Documentation",
              url: "https://spl.solana.com/token-2022",
            },
            {
              type: "docs",
              title: "Solana Developer Guides",
              url: "https://solana.com/developers/guides",
            },
          ],
          children: [
            { id: "t22-ext", label: "Extensions" },
            { id: "t22-nt", label: "NonTransferable" },
            { id: "t22-meta", label: "Token Metadata" },
          ],
        },
      ],
    },
    {
      id: "advanced",
      title: "Advanced Concepts",
      description:
        "Optimize program performance with compute unit management, lookup tables, and explore state and ZK compression.",
      resources: [
        {
          type: "docs",
          title: "Solana Documentation",
          url: "https://solana.com/docs",
        },
        {
          type: "docs",
          title: "Solana Developer Guides",
          url: "https://solana.com/developers/guides",
        },
      ],
      left: [
        {
          id: "perf",
          label: "Performance",
          description:
            "Optimize your programs by managing compute units, using address lookup tables, and leveraging versioned transactions.",
          resources: [
            {
              type: "docs",
              title: "Solana Developer Guides",
              url: "https://solana.com/developers/guides",
            },
            {
              type: "article",
              title: "Solana Cookbook",
              url: "https://solanacookbook.com",
            },
          ],
          children: [
            { id: "perf-cu", label: "Compute Units" },
            { id: "perf-lut", label: "Lookup Tables" },
            { id: "perf-vtx", label: "Versioned Transactions" },
          ],
        },
      ],
      right: [
        {
          id: "compression",
          label: "Compression",
          description:
            "Reduce on-chain storage costs using state compression with Merkle trees and ZK compression for scalable data.",
          resources: [
            {
              type: "docs",
              title: "Solana Documentation",
              url: "https://solana.com/docs",
            },
            {
              type: "docs",
              title: "Solana Developer Guides",
              url: "https://solana.com/developers/guides",
            },
          ],
          children: [
            { id: "comp-state", label: "State Compression" },
            { id: "comp-zk", label: "ZK Compression" },
            { id: "comp-merkle", label: "Merkle Trees" },
          ],
        },
      ],
    },
    {
      id: "testing",
      title: "Testing & Security",
      description:
        "Ensure program correctness and safety with comprehensive testing strategies and security best practices.",
      resources: [
        {
          type: "docs",
          title: "Anchor Framework Docs",
          url: "https://www.anchor-lang.com",
        },
        {
          type: "docs",
          title: "Solana Developer Guides",
          url: "https://solana.com/developers/guides",
        },
      ],
      left: [
        {
          id: "test",
          label: "Testing",
          description:
            "Write unit tests with Bankrun/LiteSVM, integration tests with Anchor, and fuzz tests with Trident to catch edge cases.",
          resources: [
            {
              type: "docs",
              title: "Anchor Framework Docs",
              url: "https://www.anchor-lang.com",
            },
            {
              type: "article",
              title: "Solana Cookbook",
              url: "https://solanacookbook.com",
            },
            {
              type: "docs",
              title: "Solana Developer Guides",
              url: "https://solana.com/developers/guides",
            },
          ],
          children: [
            { id: "test-lite", label: "Bankrun / LiteSVM" },
            { id: "test-anchor", label: "Anchor Tests" },
            { id: "test-fuzz", label: "Fuzz Testing (Trident)" },
          ],
        },
      ],
      right: [
        {
          id: "security",
          label: "Security",
          description:
            "Protect your program with proper signer validation, checked arithmetic to prevent overflows, and reentrancy guards.",
          resources: [
            {
              type: "docs",
              title: "Solana Developer Guides",
              url: "https://solana.com/developers/guides",
            },
            {
              type: "article",
              title: "Solana Cookbook",
              url: "https://solanacookbook.com",
            },
          ],
          children: [
            { id: "sec-signer", label: "Signer Validation" },
            { id: "sec-overflow", label: "Overflow Checks" },
            { id: "sec-reent", label: "Reentrancy Guards" },
          ],
        },
      ],
    },
    {
      id: "deploy",
      title: "Deploy to Mainnet",
      description:
        "Prepare your program for production with verifiable builds, security audits, monitoring, and multisig governance.",
      resources: [
        {
          type: "docs",
          title: "Solana Documentation",
          url: "https://solana.com/docs",
        },
        {
          type: "docs",
          title: "Solana Developer Guides",
          url: "https://solana.com/developers/guides",
        },
      ],
      left: [
        {
          id: "prep",
          label: "Preparation",
          description:
            "Get your program production-ready with verifiable builds for on-chain verification and a thorough security audit.",
          resources: [
            {
              type: "docs",
              title: "Anchor Framework Docs",
              url: "https://www.anchor-lang.com",
            },
            {
              type: "docs",
              title: "Solana Developer Guides",
              url: "https://solana.com/developers/guides",
            },
          ],
          children: [
            { id: "prep-verify", label: "Verifiable Builds" },
            { id: "prep-audit", label: "Security Audit" },
          ],
        },
      ],
      right: [
        {
          id: "ops",
          label: "Operations",
          description:
            "Run your program in production with monitoring, safe upgrade procedures, and multisig authority via Squads.",
          resources: [
            {
              type: "docs",
              title: "Solana Documentation",
              url: "https://solana.com/docs",
            },
            {
              type: "article",
              title: "Solana Cookbook",
              url: "https://solanacookbook.com",
            },
            {
              type: "docs",
              title: "Solana Developer Guides",
              url: "https://solana.com/developers/guides",
            },
          ],
          children: [
            { id: "ops-monitor", label: "Monitoring" },
            { id: "ops-upgrade", label: "Program Upgrades" },
            { id: "ops-msig", label: "Multisig (Squads)" },
          ],
        },
      ],
    },
  ],
};
