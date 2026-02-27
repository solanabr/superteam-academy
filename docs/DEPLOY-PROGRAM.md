# Deploy Program

## Prerequisites

- Solana CLI installed
- Anchor CLI 0.31.1+
- A funded deployer wallet

## Devnet Deployment

```bash
cd onchain-academy

# Set cluster to devnet
solana config set --url devnet

# Build the program
anchor build

# Deploy
anchor deploy --provider.cluster devnet

# Verify the program ID matches Anchor.toml
solana program show EHgTQKSeAAoh7JVMij46CFVzThh4xUi7RDjZjHnA7qR6
```

## Update Program ID

If deploying with a new keypair:

```bash
# From repo root
./scripts/update-program-id.sh <NEW_PROGRAM_ID>
cd onchain-academy && anchor build
```

## Mainnet Deployment

Requires explicit team confirmation and security audit completion. See the pre-mainnet checklist in CLAUDE.md.
