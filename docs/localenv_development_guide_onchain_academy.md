# Local Development Guide: Onchain Academy

This guide outlines the complete process for setting up a fresh development environment for the Superteam Academy on-chain program. It covers deployment, initialization, and the critical authority setup required for Metaplex Core credentials.

## 1. Environment Confirmation

Before you start, ensure your current addresses match your intended setup.

- **Program ID**: `AVES32TXPwZ7kuVizTZsqzBr1UVYrcZyqQ6BxHaGchWU`
- **Config PDA**: `9ZLUJ6TgRg5DWA9YhN9M6BdJkcbZTdrTxeZLZ3cLknwn`
  - *Note: This PDA is derived from the "AVES..." Program ID.*
- **Authority**: `2rwDSwX9pUwc9gVDSHgvDFAZWn41DodaeAvwS1rrZho7` (Your `id.json` wallet)

---

## 2. Deployment Steps

### A. Update Program ID
Ensure your `onchain-academy/programs/onchain-academy/src/lib.rs` and `onchain-academy/Anchor.toml` reflect your current Program ID.

```rust
// lib.rs
declare_id!("AVES32TXPwZ7kuVizTZsqzBr1UVYrcZyqQ6BxHaGchWU");
```

### B. Build and Deploy
```bash
cd onchain-academy
anchor build
anchor deploy --provider.cluster devnet
```

---

## 3. Initialization (The "Robust" Way)

The program uses a **Config PDA** to manage global state (XP mint, backend signer, etc.). This must be initialized once.

### A. Initialize Program
Run the initialization script to set up the XP mint and register your wallet as the backend signer.
```bash
# Set environment variables for the script
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
export ANCHOR_WALLET=../wallets/signer.json  # Path to your id.json

npx ts-node scripts/initialize.ts
```

### B. Create Track Collection
For NFT credentials to work, you need a Metaplex Core Master Collection.
```bash
npx ts-node scripts/create-mock-track.ts
```
> [!WARNING]
> This script might initially set the authority to your wallet. Proceed to step 4 to fix this.

---

## 4. Setting Up Authorities (CRITICAL)

To follow best practices and the original design, the **Program (Config PDA)** should own the collection, not your individual wallet. This allows the program to mint NFTs autonomously.

### Transfer Collection Authority
Run the `fix-authority.ts` script to transfer the update authority from your wallet to the Config PDA.

```bash
npx ts-node scripts/fix-authority.ts
```

**Verification**:
Run the `check-collection.ts` script to confirm.
- **Expected Update Authority**: `9ZLUJ6TgRg5DWA9YhN9M6BdJkcbZTdrTxeZLZ3cLknwn`

---

## 5. Website / Environment Sync

Your `app/.env` file MUST match the on-chain state for the flow to work correctly.

| Variable | Value |
| :--- | :--- |
| `NEXT_PUBLIC_PROGRAM_ID` | `AVES32TXPwZ7kuVizTZsqzBr1UVYrcZyqQ6BxHaGchWU` |
| `NEXT_PUBLIC_COLLECTION_ADDRESS` | *The address output by create-mock-track.ts* |
| `BACKEND_WALLET_PRIVATE_KEY` | *Your wallet's private key (base58)* |

---

## 6. Full E2E Test

Once initialized, you can run the full end-to-end flow using:
```bash
npx ts-node scripts/e2e-flow.ts
```
This script will:
1. Enroll a learner
2. Progress through lessons
3. Finalize the course
4. **Issue the NFT Credential** (Success depends on Step 4 being correct!)
