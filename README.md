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

| | Address |
|---|---|
| **Program** | [`FEjumbmTCGxTwqikEcyC13czHfTwsnk7B9erNEEuHeBB`](https://explorer.solana.com/address/FEjumbmTCGxTwqikEcyC13czHfTwsnk7B9erNEEuHeBB?cluster=devnet) |
| **XP Mint** | [`5S5pSBFe968KdjAaG5yUXX1detFrE9vR4RGvT7JqRGjd`](https://explorer.solana.com/address/5S5pSBFe968KdjAaG5yUXX1detFrE9vR4RGvT7JqRGjd?cluster=devnet) |
| **Credential Collection** | [`3kVGs49bDKKjwhP1B83QuQDdNnCcDPkMoyRGKBm6Nosb`](https://explorer.solana.com/address/3kVGs49bDKKjwhP1B83QuQDdNnCcDPkMoyRGKBm6Nosb?cluster=devnet) |
| **Authority** | [`GovRkQrjmipeWeM5CZPECM63iUNmLuHvAr4jMdCYQAcq`](https://explorer.solana.com/address/GovRkQrjmipeWeM5CZPECM63iUNmLuHvAr4jMdCYQAcq?cluster=devnet) |
| **Config PDA** | [`5EzcihtLatMMqRanQZqcmZaufctgH3rWf6Mq8sQgbdHV`](https://explorer.solana.com/address/5EzcihtLatMMqRanQZqcmZaufctgH3rWf6Mq8sQgbdHV?cluster=devnet) |

Frontend bounty applicants: [deploy your own instance](docs/DEPLOY-PROGRAM.md) on devnet.

## Tech Stack

| Layer | Stack |
|---|---|
| **Programs** | Anchor 0.31+, Rust 1.82+ |
| **XP Tokens** | Token-2022 (NonTransferable, PermanentDelegate) |
| **Credentials** | Metaplex Core NFTs (soulbound via PermanentFreezeDelegate) |
| **Testing** | ts-mocha/Chai, Cargo test |
| **Client** | TypeScript, @coral-xyz/anchor, @solana/web3.js |
| **Frontend** | Next.js 14+, React, Tailwind CSS |
| **RPC** | Helius (DAS API for credential queries + XP leaderboard) |
| **Content** | Arweave (immutable course content) |
| **Multisig** | Squads (platform authority) |

## Documentation

- **[Program Specification](docs/SPEC.md)** — 16 instructions, 6 PDA types, 26 errors, 15 events
- **[Architecture](docs/ARCHITECTURE.md)** — Account maps, data flows, CU budgets
- **[Frontend Integration](docs/INTEGRATION.md)** — PDA derivation, instruction usage, events, error handling
- **[Deployment Guide](docs/DEPLOY-PROGRAM.md)** — Deploy your own program instance on devnet
- **[Frontend Bounty](docs/bounty.md)** — $4,800 USDC bounty for building the frontend

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
