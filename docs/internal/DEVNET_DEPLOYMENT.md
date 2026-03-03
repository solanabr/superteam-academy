# Solana Academy Platform - Devnet Deployment Guide

## 🎯 Deployment Status

### ✅ Completed Setup Steps

1. **Generated Keypairs** (Step 2)
   - Signer/Authority: `6HJo2VY5NgAeTWcNq22qU6EKfsdcUPCEmC1fu1e3hvQ1`
   - Program ID: `2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw`
   - XP Mint: `BB6urY3kS15YzkM3MqRYGWZDKpB56YijHFz4q55dwXZ4`

2. **Updated Program ID** (Step 3) 
   - ✓ Updated `declare_id!()` in `programs/academy/src/lib.rs`
   - ✓ Updated `Anchor.toml` with Program ID

3. **Configured Anchor.toml** (Step 5)
   - ✓ Set cluster to `devnet`
   - ✓ Set wallet to `wallets/signer.json`

4. **Updated Environment Variables** (Step 12)
   - ✓ Added to `.env.local`:
     ```
     NEXT_PUBLIC_ANCHOR_PROGRAM_ID=2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw
     NEXT_PUBLIC_XP_TOKEN_MINT=BB6urY3kS15YzkM3MqRYGWZDKpB56YijHFz4q55dwXZ4
     NEXT_PUBLIC_BACKEND_SIGNER=6HJo2VY5NgAeTWcNq22qU6EKfsdcUPCEmC1fu1e3hvQ1
     NEXT_PUBLIC_CLUSTER=devnet
     NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
     ```

---

## ⚠️ Next Steps - Fix Compilation Errors

The program has compilation errors that need to be fixed before deployment. Here's what needs to be done:

### Issue: struct name mismatch in `lib.rs` line 143

**Error:**
```
Close enrollment instruction expects `CloseEnrollment` context but receives `CloseEnrollmentAccounts`
```

**Location:** `programs/academy/src/lib.rs:143`

**Fix:** Align struct names. Choose option A or B:

**Option A:** Rename the accounts struct in `programs/academy/src/instructions/close_enrollment.rs`:
```rust
// Change this:
pub struct CloseEnrollmentAccounts<'info> {

// To this:
pub struct CloseEnrollment<'info> {
```

**Option B:** Update the lib.rs instruction signature to match the current struct name:
```rust
// Change this:
pub fn close_enrollment(ctx: Context<CloseEnrollment>) -> Result<()> {

// To this:
pub fn close_enrollment(ctx: Context<CloseEnrollmentAccounts>) -> Result<()> {
```

### Additional Compilation Issues

After fixing the close_enrollment issue, resolve any remaining errors (there may be 97 total errors as indicated in the build output). Common patterns:

1. **Similar struct name mismatches** - Ensure Context generic type matches the import
2. **Missing imports** - Add missing instruction types to imports
3. **Feature conflicts** - Some dependencies may have optional features not properly configured

### Building the Program

Once errors are fixed, compile to WebAssembly:

```bash
cd programs/academy
cargo build --target wasm32-unknown-unknown --release
```

Expected output:
```
    Finished release profile [optimized] target(s) in XXs
```

---

## 📝 Full Deployment Sequence

After fixing compilation errors, follow this order:

### 1. **Build (Step 4)**
```bash
cd programs/academy
cargo build --target wasm32-unknown-unknown --release
```

### 2. **Fund Wallet (Step 6)**
```bash
# Check current balance
solana balance 

# Get devnet SOL (airdrop has limits, may need 2-3 requests)
solana airdrop 2
solana airdrop 2

# Or use web faucet: https://faucet.solana.com
```

Verify balance >= 3-5 SOL

### 3. **Deploy Program (Step 7)**
```bash
# Ensure you're in the repo root
cd /Users/saif/Desktop/solana-academy-platform

# Deploy with your program keypair
anchor deploy --program-name academy \
  --provider.cluster devnet \
  --program-keypair wallets/program-keypair.json
```

Expected success message:
```
Program Id: 2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw
Deploy success
```

### 4. **Initialize Program (Step 8)**
Once deployed, initialize the program to create Config PDA and XP mint:

```bash
# Set environment variables
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
export ANCHOR_WALLET=wallets/signer.json

# Run initialization (you'll need to create this script)
# npx ts-node scripts/initialize.ts
```

This one-time operation:
- Creates the `Config` PDA
- Creates the XP mint (Token-2022, NonTransferable, 0 decimals)
- Registers authority as MinterRole

### 5. **Create Test Course (Step 9)**
```bash
# npx ts-node scripts/create-mock-course.ts
```

### 6. **Verify Deployment (Step 11)**
```bash
# Show program info
solana program show 2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw

# Fetch config account
anchor account academy.Config <CONFIG_PDA> --provider.cluster devnet

# The CONFIG_PDA would be derived from [b"config"] seed
```

---

## 🔍 Important Configuration Files

### `.env.local`
```env
NEXT_PUBLIC_ANCHOR_PROGRAM_ID=2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw
NEXT_PUBLIC_XP_TOKEN_MINT=BB6urY3kS15YzkM3MqRYGWZDKpB56YijHFz4q55dwXZ4
NEXT_PUBLIC_BACKEND_SIGNER=6HJo2VY5NgAeTWcNq22qU6EKfsdcUPCEmC1fu1e3hvQ1
NEXT_PUBLIC_CLUSTER=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

### `Anchor.toml`
```toml
[provider]
cluster = "devnet"
wallet = "wallets/signer.json"

[programs.devnet]
academy = "2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw"
```

### `programs/academy/Cargo.toml`
- Removed `light-sdk` dependency (optional, only needed for Light Protocol integration)
- Removed `cpi` feature (conflicts with Anchor 0.30 without the feature available)
- Fixed dependency versions to be compatible

---

## 🛠️ Key Files Generated

- `wallets/signer.json` - Authority/payer keypair
- `wallets/program-keypair.json` - Program ID keypair  
- `wallets/xp-mint-keypair.json` - XP token mint keypair
- `scripts/generate-keypairs.js` - Keypair generation script
- `scripts/update-program-id.js` - Program ID updater script

All wallet files are gitignored for security.

---

## 🚨 Troubleshooting

### "edition2024" or dependency conflicts during build

Fix by updating problematic crates:
```bash
cargo update -p blake3 --precise 1.7.0
cargo update -p rmp --precise 0.8.14
cargo update -p rmp-serde --precise 1.3.0
```

### "Account already in use" when initializing

The Config PDA already exists. Either you already initialized successfully (re-running fails), or there's a key collision. Check on-chain:

```bash
solana account $(solana address) --url devnet
```

### Insufficient SOL

You need ~2-3 SOL for deployment + ~0.01 SOL per instruction. Use:
1. CLI airdrop (may be rate-limited to 2 SOL): `solana airdrop 2`
2. Web faucet: https://faucet.solana.com

### `anchor deploy` fails: buffer account not found

Clear stale buffer accounts:
```bash
solana program close --buffers --url devnet --keypair wallets/signer.json
```

Then retry deploy.

---

## ✨ Reference

- Full instruction reference: [INTEGRATION.md](./INTEGRATION.md)
- Program specification: [SPEC.md](./SPEC.md)
- Anchor CLI docs: https://book.anchor-lang.com/
- Solana devnet faucet: https://faucet.solana.com

