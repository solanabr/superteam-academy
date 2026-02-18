# Agent Instructions

## Production-ready codebase

Prioritize **performance** (tree-shaking, minimal re-renders, lean bundles) and **clean code** (no dead code, single-purpose modules, no AI slop). Apply to all app and integration code.

**UI primitives**: Add new components (Dialog, Select, etc.) via the shadcn CLI — do not hand-write them. Run `pnpm exec shadcn add <component>` from the app directory.

**Environment variables**: Validate with Zod before use. Define schema in `app/lib/env.ts`, parse with `safeParse`, throw on invalid (build fails via import in `next.config.ts`). Use typed `env` export — never read `process.env` directly in app code.

## Wallet & Solana in the app

Use **Connector Kit** (`@solana/connector`) for wallet connection and **@solana/kit** for all Solana integration (RPC, transactions, signing).

- **Do not** use `@solana/wallet-adapter-*` or `@solana/web3.js` for new app code.
- Use `useKitTransactionSigner`, `useSolanaClient`, `useTransactionPreparer`, and kit types/addresses instead.

**Reference**: [Connector Kit](https://www.connectorkit.dev/), app wallet setup in `app/components/providers.tsx` and `app/components/connect-wallet.tsx`.
