# 🚀 Solana Academy Platform - Devnet Deployment Guide

## Overview

This document guides you through deploying your own instance of the Solana Academy program to devnet. Each bounty applicant gets their own program instance with full authority — no shared keys, no dependencies on others.

**Status: Setup Complete ✅** — Ready for compilation, funding, and deployment.

---

## Generated Addresses

Your unique program addresses have been generated and configured:

| Item | Address |
|------|---------|
| **Program ID** | `2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw` |
| **XP Token Mint** | `BB6urY3kS15YzkM3MqRYGWZDKpB56YijHFz4q55dwXZ4` |
| **Authority/Signer** | `6HJo2VY5NgAeTWcNq22qU6EKfsdcUPCEmC1fu1e3hvQ1` |

These are already in `.env.local` and configured in `Anchor.toml`.

---

## Quick Start (5 Steps)

```bash
# 1. Fix compilation errors
node scripts/fix-compilation.js

# 2. Build WebAssembly
cd programs/academy
cargo build --target wasm32-unknown-unknown --release

# 3. Get devnet SOL
solana airdrop 2  # Run twice if needed
# Or: https://faucet.solana.com

# 4. Deploy program
cd ../..
anchor deploy --program-name academy \
  --provider.cluster devnet \
  --program-keypair wallets/program-keypair.json

# 5. Initialize on-chain (requires initialize.ts script)
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
export ANCHOR_WALLET=wallets/signer.json
npx ts-node scripts/initialize.ts
```

---

## Detailed Steps

### 1. Fix Compilation Errors

The program has struct name mismatches that need fixing.

**Option A: Automatic**
```bash
node scripts/fix-compilation.js
```

**Option B: Manual**

Edit [programs/academy/src/instructions/close_enrollment.rs](programs/academy/src/instructions/close_enrollment.rs):

```rust
// Change this:
pub struct CloseEnrollmentAccounts<'info> {

// To this:
pub struct CloseEnrollment<'info> {
```

Then check for other similar errors when building.

### 2. Build the Program

```bash
cd programs/academy
cargo build --target wasm32-unknown-unknown --release
```

**Expected output:**
```
    Finished release [optimized] target(s) in XXs
```

**If you get dependency errors:**

Pin the problematic crates:
```bash
cargo update -p blake3 --precise 1.7.0
cargo update -p rmp --precise 0.8.14
cargo update -p rmp-serde --precise 1.3.0
cargo build --target wasm32-unknown-unknown --release
```

### 3. Verify Solana Configuration

Ensure you're configured for devnet:

```bash
# Check current configuration
solana config get

# If not devnet, update:
solana config set --url devnet
solana config set --keypair wallets/signer.json
```

### 4. Fund Your Wallet

You need **3-5 SOL** for deployment + transactions (~2-3 SOL for deploy, ~0.01 per instruction).

**Option A: CLI Airdrop** (may be rate-limited)
```bash
solana airdrop 2 wallets/signer.json
solana airdrop 2 wallets/signer.json  # Run twice
```

**Option B: Web Faucet**
1. Go to https://faucet.solana.com
2. Paste your signer public key: `6HJo2VY5NgAeTWcNq22qU6EKfsdcUPCEmC1fu1e3hvQ1`
3. Request SOL

**Verify balance:**
```bash
solana balance wallets/signer.json
```

Should show >= 2 SOL before deployment.

### 5. Deploy Program

```bash
cd /Users/saif/Desktop/solana-academy-platform

anchor deploy \
  --program-name academy \
  --provider.cluster devnet \
  --program-keypair wallets/program-keypair.json
```

**Expected success output:**
```
Program Id: 2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw
Deploy success
```

This:
- Uploads your program to devnet
- Creates the program account at your Program ID
- Sets you (authority) as the programable owner

### 6. Initialize Program

One-time setup that creates:
- Config account (PDA)
- XP token mint (Token-2022, NonTransferable, 0 decimals)
- Registers authority as MinterRole

```bash
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
export ANCHOR_WALLET=wallets/signer.json

# You need to create this script (template below)
npx ts-node scripts/initialize.ts
```

**Initialize Script Template** (`scripts/initialize.ts`):

```typescript
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw");
const XP_MINT_KEYPAIR_PATH = "./wallets/xp-mint-keypair.json";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Load your IDL and create a program instance
  // Call the initialize instruction with:
  // - authority: provider.publicKey
  // - min_completions_for_reward: 1 (or adjust)

  console.log("✓ Program initialized!");
}

main().catch(console.error);
```

### 7. Verify Deployment

```bash
# Show program info
solana program show 2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw --url devnet

# Derive Config PDA (seed: b"config")
# Then fetch it:
anchor account academy.Config <DERIVED_PDA> --provider.cluster devnet
```

---

## Configuration Files

### `.env.local` (Updated)

```env
# Solana configuration
NEXT_PUBLIC_ANCHOR_PROGRAM_ID=2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw
NEXT_PUBLIC_XP_TOKEN_MINT=BB6urY3kS15YzkM3MqRYGWZDKpB56YijHFz4q55dwXZ4
NEXT_PUBLIC_BACKEND_SIGNER=6HJo2VY5NgAeTWcNq22qU6EKfsdcUPCEmC1fu1e3hvQ1
NEXT_PUBLIC_CLUSTER=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

### `Anchor.toml` (Updated)

```toml
[provider]
cluster = "devnet"
wallet = "wallets/signer.json"

[programs.devnet]
academy = "2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw"
```

### Generated Files (Secure ⚠️)

```
wallets/
├── signer.json              # Authority keypair (🔐 KEEP SECURE)
├── program-keypair.json     # Program ID keypair (🔐 KEEP SECURE)
└── xp-mint-keypair.json     # XP mint keypair (🔐 KEEP SECURE)
```

**These are in `.gitignore` — never commit them!**

---

## Deployment Scripts

### `scripts/generate-keypairs.js`
Generates all three keypairs (already run).

### `scripts/update-program-id.js`
Updates program ID in `lib.rs` and `Anchor.toml` (already run).

### `scripts/fix-compilation.js`
Auto-fixes common compilation errors.

### `scripts/deploy-interactive.sh`
Interactive guide through the full deployment process:
```bash
chmod +x scripts/deploy-interactive.sh
./scripts/deploy-interactive.sh
```

### `scripts/show-keys.sh`
Displays your configured addresses:
```bash
./scripts/show-keys.sh
```

---

## Troubleshooting

### Build Errors

**"wasm32-unknown-unknown target not found"**
```bash
rustup target add wasm32-unknown-unknown
```

**Dependency version conflicts**
```bash
cargo update -p blake3 --precise 1.7.0
cargo update -p rmp --precise 0.8.14
cargo update -p rmp-serde --precise 1.3.0
```

**"Can't find crate for `std`"**
Ensure wasm32 target is installed:
```bash
rustup target add wasm32-unknown-unknown
cargo clean
cargo build --target wasm32-unknown-unknown --release
```

### Deployment Issues

**"Insufficient SOL"**

Need 3-5 SOL. Request from:
1. Airdrop: `solana airdrop 2` (may be rate-limited)
2. Web Faucet: https://faucet.solana.com
3. Github verification: https://faucet.solana.com (requires Github account)

**"Already initialized" on init**

Config PDA already exists. Either:
1. You already successfully initialized (it's safe to skip)
2. There's a key collision (unlikely)

Check on-chain:
```bash
anchor account academy.Config <YOUR_CONFIG_PDA> --provider.cluster devnet
```

**"Buffer account not found"**

Stale buffer from failed deploy. Close it:
```bash
solana program close --buffers --url devnet --keypair wallets/signer.json
```

Then retry deployment.

**Network timeout during build**

Can happen when downloading large dependencies. Retry:
```bash
cargo clean
cargo build --target wasm32-unknown-unknown --release
```

---

## Next Steps After Deployment

1. **Create Mock Course**
   ```bash
   npx ts-node scripts/create-mock-course.ts
   ```

2. **Create Track Collection** (for credentials)
   ```bash
   npx ts-node scripts/create-mock-track.ts
   ```

3. **Start Frontend**
   ```bash
   npm run dev
   ```

4. **Test Workflow**
   - Connect wallet to frontend
   - Enroll in course
   - Complete lessons
   - Check XP balance
   - Verify transactions on [Solana Explorer](https://explorer.solana.com/?cluster=devnet)

---

## File Locations

- **Program**: [programs/academy/](programs/academy/)
- **Program ID**: In [Anchor.toml](Anchor.toml)
- **Keypairs**: [wallets/](wallets/) (🔐 Gitignored)
- **Deployment Tools**: [scripts/](scripts/)
- **Configuration**: [.env.local](.env.local)

---

## References

- **Program Specification**: [SPEC.md](./SPEC.md)
- **Integration Guide**: [INTEGRATION.md](./INTEGRATION.md)
- **Anchor Book**: https://book.anchor-lang.com/
- **Solana Docs**: https://docs.solana.com/
- **Devnet Explorer**: https://explorer.solana.com/?cluster=devnet

---

## Support

If you run into issues:

1. **Check this document** - Most issues are covered in Troubleshooting
2. **Read DEVNET_DEPLOYMENT.md** - Additional detail on each step
3. **Check build output** - Scroll up to see the actual error
4. **Verify configuration** - Run `solana config get` and confirm values
5. **Check wallet balance** - Need 3-5 SOL for smooth deployment

---

**You're ready! Start with:** `node scripts/fix-compilation.js` ➜ `cargo build --target wasm32-unknown-unknown --release` ➜ `anchor deploy ...`
