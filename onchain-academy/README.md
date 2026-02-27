# Onchain Academy

Solana on-chain program for the Superteam Academy learning platform.

## Program ID

- **Devnet**: `EHgTQKSeAAoh7JVMij46CFVzThh4xUi7RDjZjHnA7qR6`
- **XP Mint**: `H2LjXpSDff3iQsut49nGniBoAQWjERYA5BdTcmfjf9Yz` (Token-2022, soulbound)

## Build

```bash
anchor build
```

## Test

```bash
anchor test
```

## Architecture

- 16 instructions (platform management, courses, learner profiles, enrollment, credentials, achievements)
- Token-2022 soulbound XP tokens (NonTransferable + PermanentDelegate)
- Metaplex Core credentials (soulbound via PermanentFreezeDelegate)
- Achievement system with collection-based NFTs

See [docs/SPEC.md](../docs/SPEC.md) and [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for full specification.
