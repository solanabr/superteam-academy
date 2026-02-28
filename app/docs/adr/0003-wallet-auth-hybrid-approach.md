# ADR 0003: Hybrid Wallet + OAuth Authentication

**Date:** 2026-02-12
**Status:** Accepted

## Context

The bounty requires:

- **Solana Wallet Adapter** with multi-wallet support (Phantom, Solflare, etc.)
- **Google sign-in** as an alternative authentication method
- **GitHub sign-in** as a bonus
- **Account linking**: users can sign up with any method and link additional methods later
- **Wallet required** to finalize courses and receive on-chain credentials

This creates a dual authentication model: Web3 wallet for on-chain operations and OAuth for traditional user identity.

## Decision

Implement a **hybrid authentication system** combining `@solana/wallet-adapter` for wallet connectivity and **NextAuth.js v5** (Auth.js) for OAuth providers.

### Architecture

```
Authentication Layer
├── Wallet Adapter (client-side)
│   ├── ConnectionProvider (Solana devnet RPC)
│   ├── WalletProvider (Phantom, Solflare adapters)
│   ├── WalletModalProvider (connect/disconnect UI)
│   └── autoConnect: true (returning users)
│
├── NextAuth.js v5 (server-side)
│   ├── Google OAuth provider
│   ├── GitHub OAuth provider (bonus)
│   └── Session via JWT (no database required)
│
└── Account Linking Service (client-side)
    ├── LinkedAccount[] stored in localStorage
    ├── Link/unlink wallet, Google, GitHub
    └── Settings UI for account management
```

### User ID Resolution

The `LearningProgressProvider` resolves the active user ID in priority order:

1. **Wallet public key** (base58 string) — when a wallet is connected
2. **NextAuth session user ID** — when signed in via Google/GitHub
3. **`"local-learner"`** — anonymous fallback for unauthenticated browsing

Progress data reloads automatically when the active user ID changes (wallet connect/disconnect triggers a `useEffect`).

### Account Linking

The `account-linking.ts` service manages linked accounts in localStorage:

- `linkWallet(publicKey)` — associates a wallet address
- `linkGoogle(email, name)` — associates a Google account
- `linkGitHub(username)` — associates a GitHub account
- `unlinkAccount(provider)` — removes a linked account
- `getLinkedAccounts()` — retrieves all linked accounts

The Settings page shows connected accounts and allows linking/unlinking.

## Consequences

### Positive

- **Progressive authentication**: Users can browse courses, start lessons, and earn XP without any authentication. Wallet connection is only required for on-chain operations (enrollment, credentials).
- **No backend database**: NextAuth uses JWT sessions — no user table needed. All user state lives in localStorage keyed by user ID. This simplifies deployment to static hosting.
- **Seamless wallet UX**: `autoConnect: true` reconnects returning users without a prompt. `WalletMultiButton` provides a familiar connect/disconnect UI.
- **Future-proof**: When the backend signing flow is implemented, the wallet public key serves as the on-chain identity. The service interface (`getCredentials(wallet)`) already accepts a wallet address.

### Negative

- **No cross-device sync**: Progress is in localStorage, so signing in on a new device starts fresh. Mitigated by on-chain progress reads when wallet is connected — chain state provides the canonical record.
- **Account linking is local**: The linking between wallet and OAuth accounts exists only in localStorage. A production deployment would need a backend to persist these associations.
- **Two auth states to manage**: Components must handle both wallet and session state. The `LearningProgressProvider` abstracts this, but the Settings page needs to show both connection types.

### Alternatives Considered

- **Wallet-only auth**: Simpler, but excludes users without Solana wallets. The bounty explicitly requires Google sign-in.
- **NextAuth with Solana credential provider**: Would unify auth under one system, but wallet adapter's built-in UI (modal, multi-wallet) would be lost. Wallet signing for NextAuth credentials adds friction.
- **Privy / Dynamic**: Third-party embedded wallet + social login SDKs. Clean API but adds a vendor dependency and monthly cost. The bounty values open-source, forkable solutions.
- **Supabase Auth**: Provides both OAuth and a user database. Would solve cross-device sync but adds infrastructure. Noted in bounty FAQ as acceptable for MVP.
