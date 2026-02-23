# Superteam Academy

Decentralized learning platform on Solana. Learners enroll in courses, complete lessons to earn soulbound XP tokens, receive Metaplex Core credential NFTs, and collect achievements. Course creators earn XP rewards. Platform governed by multisig authority.

## Monorepo Structure

```
superteam-academy/
├── onchain-academy/          ← Anchor program (deployed on devnet)
│   ├── programs/             ← Rust program source (16 instructions)
│   ├── tests/                ← 77 Rust + 62 TypeScript tests
│   └── scripts/              ← Devnet interaction scripts
├── app/                      ← Next.js frontend (bounty)
├── sdk/                      ← TypeScript SDK (future)
├── docs/                     ← Documentation
│   ├── SPEC.md               ← Program specification
│   ├── ARCHITECTURE.md       ← Account maps, data flows, CU budgets
│   ├── INTEGRATION.md        ← Frontend integration guide
│   └── DEPLOY-PROGRAM.md     ← Deploy your own devnet instance
└── wallets/                  ← Keypairs (gitignored)
```

## Quick Start

```bash
git clone https://github.com/solanabr/superteam-academy.git
cd superteam-academy/onchain-academy

# Install dependencies
yarn install

# Build the program
anchor build

# Run tests (localnet)
anchor test

# Rust unit tests
cargo test --manifest-path tests/rust/Cargo.toml
```

## Devnet Deployment

The program is live on devnet:

| **Program** | [`AVES32TXPwZ7kuVizTZsqzBr1UVYrcZyqQ6BxHaGchWU`](https://explorer.solana.com/address/AVES32TXPwZ7kuVizTZsqzBr1UVYrcZyqQ6BxHaGchWU?cluster=devnet) |
| **XP Mint** | [`DKn9Mf8BDy6Suu2fmJmkYkY2RyyTxwR5EjhHbtPz9RBU`](https://explorer.solana.com/address/DKn9Mf8BDy6Suu2fmJmkYkY2RyyTxwR5EjhHbtPz9RBU?cluster=devnet) |
| **Authority** | [`2rwDSwX9pUwc9gVDSHgvDFAZWn41DodaeAvwS1rrZho7`](https://explorer.solana.com/address/2rwDSwX9pUwc9gVDSHgvDFAZWn41DodaeAvwS1rrZho7?cluster=devnet) |

Frontend bounty applicants: [deploy your own instance](docs/DEPLOY-PROGRAM.md) on devnet.

## Tech Stack

| Layer | Stack |
|---|---|
| **Programs** | Anchor 0.31+, Rust 1.82+ |
| **XP Tokens** | Token-2022 (NonTransferable, PermanentDelegate) |
| **Credentials** | Metaplex Core NFTs (soulbound via PermanentFreezeDelegate) |
| **Testing** | ts-mocha/Chai, Cargo test |
| **Client** | TypeScript, @coral-xyz/anchor, @solana/web3.js |
| **Frontend** | Next.js 14+ (App Router), React, Tailwind CSS |
| **RPC** | Helius (DAS API for credential queries) |
| **Content** | Sanity.io Headless CMS (Embedded Studio) |
| **Database** | PostgreSQL via Prisma (Leaderboard/State abstraction) |
| **Multisig** | Squads (platform authority) |

## Hackathon Delivery Notes

For the hackathon submission, this repository includes a fully functional frontend combined with a live Anchor program on Devnet. 

**Architectural Focus:**
- **Leaderboard Abstraction:** Since Solana Token-2022 accounts cannot be queried historically for daily/weekly metrics without an off-chain indexer, the Leaderboard relies on the local Postgres database (`XpEvent` logs) as a clean abstraction and read-cache for the on-chain Token-2022 mints.
- **Sanity CMS:** Course content is mastered in Sanity Studio rather than Arweave for this iteration, providing an exceptional content management experience directly at `[Domain]/studio`.
- **Privy Auth:** Users authenticate seamlessly via Privy, which provisions embedded Solana Wallets allowing for direct on-chain actions like "Reclaiming Rent" to be signed from the browser without a browser extension.

## Documentation

- **[Program Specification](docs/SPEC.md)** — 16 instructions, 6 PDA types, 26 errors, 15 events
- **[Architecture](docs/ARCHITECTURE.md)** — Account maps, data flows, CU budgets
- **[Frontend Integration](docs/INTEGRATION.md)** — PDA derivation, instruction usage, events, error handling
- **[Deployment Guide](docs/DEPLOY-PROGRAM.md)** — Deploy your own program instance on devnet
- **[Frontend Bounty](docs/bounty.md)** — $4,800 USDC bounty for building the frontend

## Future Feature Plans

- **Signless Transactions**: Implement [Privy Delegated Actions](https://docs.privy.io/wallets/delegated-actions/overview) to provide a frictionless "signless" experience for background tasks like reclaiming rent and small token operations, once user-awareness preferences are met.

## Contributing

```bash
# Branch naming
git checkout -b <type>/<scope>-<description>-<DD-MM-YYYY>
# Examples:
#   feat/enrollment-lessons-11-02-2026
#   fix/cooldown-check-12-02-2026
#   docs/integration-guide-17-02-2026

# Before merging
anchor build
cargo fmt
cargo clippy -- -W clippy::all
cargo test --manifest-path onchain-academy/tests/rust/Cargo.toml
anchor test
```

## License

[MIT](LICENSE)
