import type { RoadmapDef } from "./types";

export const solanaDapp: RoadmapDef = {
  slug: "solana-dapp",
  title: "Solana dApp Frontend",
  description: "Build production frontends that interact with Solana programs.",
  sections: [
    {
      id: "web-fund",
      title: "Web Fundamentals",
      description:
        "Solid TypeScript and React skills are the foundation for building any Solana frontend.",
      resources: [
        {
          type: "docs",
          title: "TypeScript Handbook",
          url: "https://www.typescriptlang.org/docs/handbook/intro.html",
        },
        {
          type: "docs",
          title: "Next.js Documentation",
          url: "https://nextjs.org/docs",
        },
      ],
      left: [
        {
          id: "ts",
          label: "TypeScript",
          description:
            "TypeScript adds static types to JavaScript, catching errors at compile time and improving developer experience.",
          resources: [
            {
              type: "docs",
              title: "TypeScript Documentation",
              url: "https://www.typescriptlang.org/docs/",
            },
            {
              type: "article",
              title: "TypeScript for JavaScript Programmers",
              url: "https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html",
            },
          ],
          children: [
            { id: "ts-types", label: "Types & Interfaces" },
            { id: "ts-async", label: "Async / Await" },
            { id: "ts-modules", label: "ES Modules" },
          ],
        },
      ],
      right: [
        {
          id: "react",
          label: "React / Next.js",
          description:
            "React is the dominant UI library for Solana dApps. Next.js adds server-side rendering, routing, and API routes.",
          resources: [
            {
              type: "docs",
              title: "Next.js Getting Started",
              url: "https://nextjs.org/docs/getting-started",
            },
            {
              type: "docs",
              title: "React Documentation",
              url: "https://react.dev/learn",
            },
            {
              type: "article",
              title: "Solana dApp Scaffold (Next.js)",
              url: "https://github.com/solana-labs/dapp-scaffold",
            },
          ],
          children: [
            { id: "react-comp", label: "Components & Hooks" },
            { id: "react-rsc", label: "Server Components" },
            { id: "react-route", label: "App Router" },
          ],
        },
      ],
    },
    {
      id: "web3js",
      title: "Solana Web3.js",
      description:
        "The core JavaScript client library for interacting with Solana clusters, sending transactions, and reading account data.",
      resources: [
        {
          type: "docs",
          title: "Solana Web3.js Reference",
          url: "https://solana.com/docs/clients/javascript",
        },
        {
          type: "article",
          title: "Solana Cookbook",
          url: "https://solanacookbook.com",
        },
      ],
      left: [
        {
          id: "core-api",
          label: "Core APIs",
          description:
            "Connection, PublicKey, and Transaction are the three fundamental classes you use in every Solana frontend.",
          resources: [
            {
              type: "docs",
              title: "Web3.js - JavaScript Client",
              url: "https://solana.com/docs/clients/javascript",
            },
            {
              type: "article",
              title: "Solana Cookbook - Getting Started",
              url: "https://solanacookbook.com/getting-started/installation.html",
            },
          ],
          children: [
            { id: "api-conn", label: "Connection" },
            { id: "api-pk", label: "PublicKey" },
            { id: "api-tx", label: "Transaction" },
          ],
        },
      ],
      right: [
        {
          id: "web3-concepts",
          label: "Key Concepts",
          description:
            "Understanding keypairs, instructions, and blockhash mechanics is essential for building reliable transaction flows.",
          resources: [
            {
              type: "docs",
              title: "Solana Developer Guides",
              url: "https://solana.com/developers/guides",
            },
            {
              type: "article",
              title: "Solana Cookbook - Transactions",
              url: "https://solanacookbook.com/core-concepts/transactions.html",
            },
            {
              type: "docs",
              title: "Solana RPC Methods",
              url: "https://solana.com/docs/rpc",
            },
          ],
          children: [
            { id: "w3c-kp", label: "Keypairs & Signatures" },
            { id: "w3c-ix", label: "Instructions" },
            { id: "w3c-bh", label: "Blockhash & Confirmation" },
          ],
        },
      ],
    },
    {
      id: "wallets",
      title: "Wallet Integration",
      description:
        "Connecting browser wallets lets users sign transactions and prove ownership of their accounts.",
      resources: [
        {
          type: "docs",
          title: "Wallet Adapter Docs",
          url: "https://github.com/anza-xyz/wallet-adapter",
        },
        {
          type: "article",
          title: "Solana Cookbook - Wallets",
          url: "https://solanacookbook.com/integrations/wallets.html",
        },
      ],
      left: [
        {
          id: "wal-adapt",
          label: "Wallet Adapters",
          description:
            "The wallet-adapter library provides a unified interface for connecting Phantom, Solflare, and other Solana wallets.",
          resources: [
            {
              type: "docs",
              title: "Wallet Adapter GitHub",
              url: "https://github.com/anza-xyz/wallet-adapter",
            },
            {
              type: "article",
              title: "Solana Developer Guides - Wallets",
              url: "https://solana.com/developers/guides",
            },
            {
              type: "docs",
              title: "Phantom Developer Docs",
              url: "https://docs.phantom.app/solana",
            },
          ],
          children: [
            { id: "wal-lib", label: "@solana/wallet-adapter" },
            { id: "wal-phantom", label: "Phantom" },
            { id: "wal-solflare", label: "Solflare" },
          ],
        },
      ],
      right: [
        {
          id: "wal-auth",
          label: "Auth Patterns",
          description:
            "Wallet-based authentication replaces traditional login flows by having users sign a message to prove account ownership.",
          resources: [
            {
              type: "article",
              title: "Sign In With Solana Specification",
              url: "https://github.com/phantom/sign-in-with-solana",
            },
            {
              type: "article",
              title: "Solana Cookbook - Sign Message",
              url: "https://solanacookbook.com/references/keypairs-and-wallets.html",
            },
          ],
          children: [
            { id: "auth-sign", label: "Sign Message" },
            { id: "auth-siws", label: "Sign In With Solana" },
            { id: "auth-session", label: "Session Tokens" },
          ],
        },
      ],
    },
    {
      id: "prog-interact",
      title: "Program Interaction",
      description:
        "Call on-chain Solana programs from your frontend using the Anchor client SDK or raw instruction builders.",
      resources: [
        {
          type: "docs",
          title: "Anchor TypeScript Client",
          url: "https://www.anchor-lang.com/docs/clients/typescript",
        },
        {
          type: "article",
          title: "Solana Cookbook - Programs",
          url: "https://solanacookbook.com/core-concepts/programs.html",
        },
      ],
      left: [
        {
          id: "anchor-client",
          label: "Anchor Client",
          description:
            "Anchor generates a TypeScript client from your IDL, giving you type-safe method calls and account deserialization.",
          resources: [
            {
              type: "docs",
              title: "Anchor TS Client Guide",
              url: "https://www.anchor-lang.com/docs/clients/typescript",
            },
            {
              type: "article",
              title: "Solana Cookbook - Anchor",
              url: "https://solanacookbook.com/gaming/anchor.html",
            },
            {
              type: "docs",
              title: "Anchor IDL Specification",
              url: "https://www.anchor-lang.com/docs/the-program-module",
            },
          ],
          children: [
            { id: "anc-idl-c", label: "IDL Parsing" },
            { id: "anc-methods", label: "Program Methods" },
            { id: "anc-events", label: "Event Listening" },
          ],
        },
      ],
      right: [
        {
          id: "raw-ix",
          label: "Raw Instructions",
          description:
            "Building instructions manually gives you full control over account metas and data serialization without Anchor.",
          resources: [
            {
              type: "docs",
              title: "Solana Web3.js - TransactionInstruction",
              url: "https://solana.com/docs/clients/javascript",
            },
            {
              type: "article",
              title: "Solana Cookbook - Sending Transactions",
              url: "https://solanacookbook.com/references/basic-transactions.html",
            },
          ],
          children: [
            { id: "raw-ti", label: "TransactionInstruction" },
            { id: "raw-buf", label: "Buffer Encoding" },
            { id: "raw-meta", label: "AccountMeta" },
          ],
        },
      ],
    },
    {
      id: "tx-build",
      title: "Transaction Building",
      description:
        "Construct and optimize Solana transactions with priority fees, versioned formats, and lookup tables.",
      resources: [
        {
          type: "docs",
          title: "Versioned Transactions",
          url: "https://solana.com/docs/advanced/versions",
        },
        {
          type: "article",
          title: "Solana Developer Guides",
          url: "https://solana.com/developers/guides",
        },
      ],
      left: [
        {
          id: "tx-basics",
          label: "Basics",
          description:
            "Start with single-instruction transactions, then compose multiple instructions and add priority fees for faster inclusion.",
          resources: [
            {
              type: "article",
              title: "Solana Cookbook - Transactions",
              url: "https://solanacookbook.com/references/basic-transactions.html",
            },
            {
              type: "docs",
              title: "Solana Transaction Fees",
              url: "https://solana.com/docs/core/fees",
            },
          ],
          children: [
            { id: "txb-single", label: "Single Instruction" },
            { id: "txb-multi", label: "Multi-Instruction" },
            { id: "txb-fee", label: "Priority Fees" },
          ],
        },
      ],
      right: [
        {
          id: "tx-adv",
          label: "Advanced",
          description:
            "Versioned transactions and address lookup tables increase the number of accounts per transaction. Jito bundles guarantee atomic execution ordering.",
          resources: [
            {
              type: "docs",
              title: "Versioned Transactions Guide",
              url: "https://solana.com/docs/advanced/versions",
            },
            {
              type: "docs",
              title: "Address Lookup Tables",
              url: "https://solana.com/docs/advanced/lookup-tables",
            },
            {
              type: "article",
              title: "Jito Documentation",
              url: "https://www.jito.wtf/docs",
            },
          ],
          children: [
            { id: "txa-vtx", label: "Versioned Transactions" },
            { id: "txa-lut", label: "Address Lookup Tables" },
            { id: "txa-jito", label: "Jito Bundles" },
          ],
        },
      ],
    },
    {
      id: "data-fetch",
      title: "Data Fetching",
      description:
        "Read on-chain account state using RPC methods, WebSocket subscriptions, and third-party indexing services.",
      resources: [
        {
          type: "docs",
          title: "Solana RPC API",
          url: "https://solana.com/docs/rpc",
        },
        {
          type: "docs",
          title: "Helius Documentation",
          url: "https://docs.helius.dev",
        },
      ],
      left: [
        {
          id: "onchain-data",
          label: "On-Chain Data",
          description:
            "Use getAccountInfo for single accounts, getProgramAccounts for filtered queries, and WebSocket subscriptions for real-time updates.",
          resources: [
            {
              type: "docs",
              title: "Solana RPC HTTP Methods",
              url: "https://solana.com/docs/rpc/http",
            },
            {
              type: "docs",
              title: "Solana RPC WebSocket Methods",
              url: "https://solana.com/docs/rpc/websocket",
            },
            {
              type: "article",
              title: "Solana Cookbook - Accounts",
              url: "https://solanacookbook.com/core-concepts/accounts.html",
            },
          ],
          children: [
            { id: "ocd-gai", label: "getAccountInfo" },
            { id: "ocd-gpa", label: "getProgramAccounts" },
            { id: "ocd-ws", label: "WebSocket Subscriptions" },
          ],
        },
      ],
      right: [
        {
          id: "indexing",
          label: "Indexing",
          description:
            "Indexing services like Helius DAS API and Geyser plugins provide faster, richer queries than raw RPC calls.",
          resources: [
            {
              type: "docs",
              title: "Helius DAS API",
              url: "https://docs.helius.dev",
            },
            {
              type: "article",
              title: "Solana Cookbook - Geyser",
              url: "https://solanacookbook.com/references/accounts.html",
            },
          ],
          children: [
            { id: "idx-helius", label: "Helius DAS API" },
            { id: "idx-geyser", label: "Geyser Plugins" },
            { id: "idx-graph", label: "The Graph" },
          ],
        },
      ],
    },
    {
      id: "frontend",
      title: "Frontend Patterns",
      description:
        "Proven UX and state management patterns for handling the async, error-prone nature of blockchain interactions.",
      resources: [
        {
          type: "docs",
          title: "TanStack Query (React Query)",
          url: "https://tanstack.com/query",
        },
        {
          type: "article",
          title: "Solana Cookbook",
          url: "https://solanacookbook.com",
        },
      ],
      left: [
        {
          id: "ux",
          label: "UX Patterns",
          description:
            "Optimistic updates, clear error messages, and loading skeletons are critical for making blockchain dApps feel responsive.",
          resources: [
            {
              type: "article",
              title: "Solana Developer Guides - Frontend",
              url: "https://solana.com/developers/guides",
            },
            {
              type: "docs",
              title: "React Query - Optimistic Updates",
              url: "https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates",
            },
          ],
          children: [
            { id: "ux-opt", label: "Optimistic Updates" },
            { id: "ux-err", label: "Error Handling" },
            { id: "ux-load", label: "Loading States" },
          ],
        },
      ],
      right: [
        {
          id: "state",
          label: "State Management",
          description:
            "React Query handles server state and caching while Zustand manages client-side state for wallet and UI concerns.",
          resources: [
            {
              type: "docs",
              title: "TanStack Query Documentation",
              url: "https://tanstack.com/query",
            },
            {
              type: "docs",
              title: "Zustand GitHub",
              url: "https://github.com/pmndrs/zustand",
            },
            {
              type: "article",
              title: "Solana dApp Scaffold",
              url: "https://github.com/solana-labs/dapp-scaffold",
            },
          ],
          children: [
            { id: "state-rq", label: "React Query" },
            { id: "state-zust", label: "Zustand" },
            { id: "state-cache", label: "Account Caching" },
          ],
        },
      ],
    },
    {
      id: "production",
      title: "Production",
      description:
        "Ship reliable dApps with proper RPC infrastructure, rate limiting, monitoring, and performance optimizations.",
      resources: [
        {
          type: "docs",
          title: "Helius - RPC Infrastructure",
          url: "https://docs.helius.dev",
        },
        {
          type: "article",
          title: "Solana Developer Guides - Production",
          url: "https://solana.com/developers/guides",
        },
      ],
      left: [
        {
          id: "infra",
          label: "Infrastructure",
          description:
            "Production dApps need dedicated RPC providers, request rate limiting, and uptime monitoring to stay reliable under load.",
          resources: [
            {
              type: "docs",
              title: "Helius RPC Plans",
              url: "https://docs.helius.dev",
            },
            {
              type: "docs",
              title: "Solana RPC Providers",
              url: "https://solana.com/docs/rpc",
            },
          ],
          children: [
            { id: "infra-rpc", label: "RPC Providers" },
            { id: "infra-rate", label: "Rate Limiting" },
            { id: "infra-mon", label: "Monitoring" },
          ],
        },
      ],
      right: [
        {
          id: "perf-fe",
          label: "Performance",
          description:
            "Prefetch account data, paginate large queries, and choose between WebSocket subscriptions and polling based on update frequency.",
          resources: [
            {
              type: "docs",
              title: "React Query - Prefetching",
              url: "https://tanstack.com/query/latest/docs/framework/react/guides/prefetching",
            },
            {
              type: "article",
              title: "Solana Cookbook - getProgramAccounts",
              url: "https://solanacookbook.com/guides/get-program-accounts.html",
            },
            {
              type: "docs",
              title: "Solana WebSocket API",
              url: "https://solana.com/docs/rpc/websocket",
            },
          ],
          children: [
            { id: "pfe-prefetch", label: "Prefetching" },
            { id: "pfe-pag", label: "Pagination" },
            { id: "pfe-ws", label: "WebSocket vs Polling" },
          ],
        },
      ],
    },
  ],
};
