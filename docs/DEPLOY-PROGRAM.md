# Deploying Onchain Academy to Devnet

Each bounty applicant deploys their own program instance on devnet. This gives you full authority over the program — no shared keys, no waiting on others, and a clean environment to test your frontend against.

Full instruction reference: [INTEGRATION.md](./INTEGRATION.md) | Program specification: [SPEC.md](./SPEC.md)

---

## Prerequisites

| Tool | Version |
|------|---------|
| Rust | 1.82+ |
| Solana CLI | 1.18+ |
| Anchor CLI | 0.31+ |
| Node.js | 18+ |
| yarn | any |

Verify:

```bash
rustc --version
solana --version
anchor --version
node --version
```

---

## 1. Clone and Setup

```bash
git clone https://github.com/solanabr/superteam-academy
cd superteam-academy/onchain-academy
yarn install
```

---

## 2. Generate Keypairs

Three keypairs are needed. All go in the `wallets/` directory at the repo root (gitignored).

```bash
mkdir -p wallets
```

**Authority/payer keypair** — your deployer wallet. Skip this step if you already have a Solana CLI wallet you want to use; copy it to `wallets/signer.json`.

```bash
solana-keygen new --outfile wallets/signer.json
```

**Program keypair** — determines the program ID. Use `grind` for a vanity address (optional) or `new` for a random one.

```bash
# Option A: random
solana-keygen new --outfile wallets/program-keypair.json

# Option B: vanity (takes time, skip on first deploy)
solana-keygen grind --starts-with ACAD:1 --outfile wallets/program-keypair.json
```

**XP mint keypair** — determines the XP token mint address. This is passed as a signer to `initialize`, not a PDA.

```bash
# Option A: random
solana-keygen new --outfile wallets/xp-mint-keypair.json

# Option B: vanity
solana-keygen grind --starts-with XP:1 --outfile wallets/xp-mint-keypair.json
```

Confirm all three exist:

```bash
ls wallets/
# signer.json  program-keypair.json  xp-mint-keypair.json
```

---

## 3. Update Program ID

Run the script from the repo root. It reads the pubkey from `wallets/program-keypair.json` and patches `declare_id!()` in `lib.rs` and the `onchain_academy` entry in `Anchor.toml`.

```bash
chmod +x scripts/update-program-id.sh
./scripts/update-program-id.sh
```

The script uses `sed -i ''` (macOS syntax). On Linux, edit the script to use `sed -i` without the empty string:

```bash
# In scripts/update-program-id.sh, change:
sed -i '' "s/..."
# To:
sed -i "s/..."
```

Verify the program ID was updated:

```bash
grep "declare_id" onchain-academy/programs/onchain-academy/src/lib.rs
grep "onchain_academy" onchain-academy/Anchor.toml
```

Both should show the pubkey from `wallets/program-keypair.json`.

---

## 4. Build

```bash
cd onchain-academy
anchor build
```

After a successful build, the IDL is at:
- `target/types/onchain_academy.ts` — TypeScript types for your client
- `target/idl/onchain_academy.json` — raw JSON IDL

**If you get `edition2024` or dependency resolution errors**, pin these crates and rebuild:

```bash
cargo update -p blake3 --precise 1.7.0
cargo update -p rmp --precise 0.8.14
cargo update -p rmp-serde --precise 1.3.0
anchor build
```

---

## 5. Configure Devnet

Edit `onchain-academy/Anchor.toml`. Change the cluster:

```toml
[provider]
cluster = "devnet"
wallet = "../wallets/signer.json"
```

Also update the programs table key. Change `[programs.localnet]` to `[programs.devnet]`:

```toml
[programs.devnet]
onchain_academy = "<YOUR_PROGRAM_ID>"
```

Set Solana CLI to devnet:

```bash
solana config set --url devnet
solana config set --keypair ../wallets/signer.json
```

---

## 6. Fund Your Wallet

You need 3-5 SOL for deployment and transactions.

```bash
# Airdrop (limited to 2 SOL per request, run twice if needed)
solana airdrop 2 wallets/signer.json
solana airdrop 2 wallets/signer.json

# Check balance
solana balance ../wallets/signer.json
```

If the CLI airdrop is rate-limited, connect Github and use the web faucet: https://faucet.solana.com

---

## 7. Deploy

Run from inside `onchain-academy/`:

```bash
anchor deploy --program-name onchain_academy --provider.cluster devnet --program-keypair ../wallets/program-keypair.json
```

On success you will see:

```
Program Id: <YOUR_PROGRAM_ID>
Deploy success
```

---

## 8. Initialize the Program

This is a one-time operation that:
- Creates the `Config` PDA
- Creates the XP mint (Token-2022, NonTransferable + PermanentDelegate, 0 decimals)
- Auto-registers the authority as a `MinterRole` (label: "backend", unlimited cap)

The deployer wallet becomes both `authority` and `backend_signer` — no separate backend key needed for devnet.

Run `scripts/initialize.ts`:

```bash
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
export ANCHOR_WALLET=../wallets/signer.json \
npx ts-node scripts/initialize.ts
```

Note: `initialize` will fail with `already initialized` if run a second time — this is expected. The program enforces single initialization via the `config` PDA init constraint.

Note on XP token metadata: The `initialize` instruction sets the `MetadataPointer` extension on the mint but defers actual metadata initialization to a separate client transaction. This is cosmetic — the mint works fully for XP minting without it. You can initialize metadata later when building the frontend.

---

## 9. Create a Test Course

```bash
npx ts-node scripts/create-mock-course.ts
```

---

## 10. Create Track Collection (optional — credential flow only)

Required only if you are testing `issue_credential` or `upgrade_credential`. Metaplex Core is already deployed on devnet — no fixtures needed.

```bash
npx ts-node scripts/create-mock-track.ts
```

Store the collection address — it is required as an account in `issue_credential`.

---

## 11. Verify Deployment

```bash
# Show program info
solana program show <YOUR_PROGRAM_ID>

# Fetch config account
anchor account onchain_academy.Config <CONFIG_PDA> --provider.cluster devnet

# Check XP mint
spl-token display <XP_MINT_ADDRESS> --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
```

---

## 12. Frontend Environment Variables

Add these to your `.env.local`:

```env
# Public (safe to expose)
NEXT_PUBLIC_PROGRAM_ID=<YOUR_PROGRAM_ID>
NEXT_PUBLIC_XP_MINT=<YOUR_XP_MINT_ADDRESS>
NEXT_PUBLIC_BACKEND_SIGNER=<YOUR_AUTHORITY_PUBKEY>
NEXT_PUBLIC_CLUSTER=devnet

# Server-side only (never expose to client)
BACKEND_SIGNER_KEYPAIR=../wallets/signer.json
```

For devnet, `NEXT_PUBLIC_BACKEND_SIGNER` is the same as your authority public key. In production these are separate keys.

---

## Quick Reference

```bash
# Full deploy sequence (run from repo root)
./scripts/update-program-id.sh
cd onchain-academy && anchor build
# Edit Anchor.toml: cluster = "devnet", [programs.devnet]
solana airdrop 2 wallets/signer.json
anchor deploy --program-name onchain_academy --provider.cluster devnet --program-keypair ../wallets/program-keypair.json

# Initialize (run from onchain-academy/)
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
ANCHOR_WALLET=../wallets/signer.json \
npx ts-node scripts/initialize.ts

# Verify
solana program show <PROGRAM_ID>
```

---

## Troubleshooting

**`edition2024` or `rmp-serde` build errors**

Rust edition 2024 resolver conflicts. Pin the affected crates:

```bash
cargo update -p blake3 --precise 1.7.0
cargo update -p rmp --precise 0.8.14
cargo update -p rmp-serde --precise 1.3.0
anchor build
```

**`sed: illegal option` on Linux**

The `update-program-id.sh` script uses macOS `sed -i ''` syntax. On Linux, edit the two `sed` lines in the script to remove the empty string argument:

```bash
# macOS (default in repo)
sed -i '' "s/..."

# Linux
sed -i "s/..."
```

**`Error: Account already in use` / "already initialized"**

The Config PDA already exists at this program ID. Either you already initialized successfully, or there is a key collision. Check the Config PDA on-chain:

```bash
solana account $(solana-keygen pubkey wallets/signer.json) --url devnet
```

If you want a fresh deployment, generate a new program keypair and redeploy.

**Insufficient SOL**

Deployment costs roughly 2-3 SOL. `initialize` costs an additional ~0.01 SOL for rent. Use https://faucet.solana.com if the CLI airdrop is rate-limited.

**`anchor deploy` fails: buffer account not found**

Anchor uses an intermediate buffer account for deployment. If a previous deploy failed mid-way:

```bash
anchor deploy --program-name onchain_academy --provider.cluster devnet \
  --program-keypair ../wallets/program-keypair.json
```

Or close the stale buffer:

```bash
solana program close --buffers --url devnet --keypair wallets/signer.json
```

**`anchor build` does not pick up the new program ID**

Run `anchor clean` before rebuilding to clear cached artifacts:

```bash
anchor clean && anchor build
```
