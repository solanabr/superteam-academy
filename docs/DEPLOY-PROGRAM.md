> Last synced: 2026-03-02

# Deploying Onchain Academy to Devnet

Each bounty applicant deploys their own program instance on devnet. This gives you full authority over the program — no shared keys, no waiting on others, and a clean environment to test your frontend against.

Architecture reference: [ARCHITECTURE.md](./ARCHITECTURE.md) (program specification + on-chain details)

> **⚠️ The program is now Pinocchio-only (the Anchor build was retired).** The
> canonical, current runbook is **[Pinocchio Runtime § Fresh devnet
> instance](#fresh-devnet-instance-self-owned-id)** below — it builds with
> `cargo build-sbf` and deploys with `solana program deploy`. The legacy §1–12
> below still describe the old Anchor-CLI flow (`update-program-id.sh`,
> `anchor deploy`, `anchor account`, editing `Anchor.toml`); those commands no
> longer apply — `Anchor.toml` and the Anchor crate have been deleted. Read
> §1–2, §6, §8–12 for context (keypairs, funding, initialize, verify), but take
> the build/deploy steps (§3–5, §7) from the Fresh devnet instance runbook.

---

## Prerequisites

| Tool       | Version |
| ---------- | ------- |
| Rust       | 1.82+   |
| Solana CLI | 1.18+   |
| Anchor CLI | 0.31+   |
| Node.js    | 18+     |
| pnpm       | any     |

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
pnpm install
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
pnpm build:pinocchio
```

The committed IDL the clients load lives at:

- `idl/onchain_academy.ts` — TypeScript types for your client
- `idl/onchain_academy.json` — raw JSON IDL

**If you get `edition2024` or dependency resolution errors**, pin these crates and rebuild:

```bash
cargo update -p blake3 --precise 1.7.0
cargo update -p rmp --precise 0.8.14
cargo update -p rmp-serde --precise 1.3.0
pnpm build:pinocchio
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
NEXT_PUBLIC_XP_MINT_ADDRESS=<YOUR_XP_MINT_ADDRESS>
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Server-side only (never expose to client)
BACKEND_SIGNER_SECRET=<BASE58_PRIVATE_KEY>
PROGRAM_AUTHORITY_SECRET=<BASE58_PRIVATE_KEY>
```

For devnet, `BACKEND_SIGNER_SECRET` and `PROGRAM_AUTHORITY_SECRET` can be the same keypair (as base58). In production these are separate keys.

To extract the base58 private key from a Solana keypair JSON file:

```bash
node -e "const k=require('./wallets/signer.json'); const bs58=require('bs58'); console.log(bs58.encode(Buffer.from(k)))"
```

---

## Quick Reference

See [Pinocchio Runtime § Fresh devnet instance](#fresh-devnet-instance-self-owned-id)
for the full, live deploy runbook. In short:

```bash
# Build the deploy artifact (run from onchain-academy/)
pnpm build:pinocchio:fresh

# Deploy under your own wallet (fee payer + upgrade authority default to
# ~/.config/solana/id.json)
solana program deploy target/deploy/onchain_academy_pinocchio_fresh.so \
  --program-id wallets/pinocchio-program-devnet.json --url devnet

# Initialize
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
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
pnpm build:pinocchio
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

**`solana program deploy` fails mid-way (buffer account left behind)**

A failed deploy can leave a funded intermediate buffer account. Reclaim its
rent and retry:

```bash
solana program close --buffers --url devnet --keypair wallets/signer.json
```

---

## Pinocchio Runtime

The program is built with Pinocchio
(`onchain-academy/programs/onchain-academy-pinocchio`) — see
[SPEC.md](./SPEC.md) and [ANCHOR-VS-PINOCCHIO.md](./ANCHOR-VS-PINOCCHIO.md).
The live deploy path is a **fresh devnet instance** under a self-owned program
id (built with `--features fresh-id`): a clean sandbox for end-to-end testing.
Runbook below.

### Build

```bash
cd onchain-academy
pnpm build:pinocchio
# = cargo build-sbf --manifest-path programs/onchain-academy-pinocchio/Cargo.toml --tools-version v1.54
```

Pinocchio 0.11.2 requires rustc >= 1.89, hence the pinned platform-tools
`v1.54` (any Agave 2.x/3.x CLI downloads it on demand). Artifact:
`target/deploy/onchain_academy_pinocchio.so`.

The default build bakes the upstream program id. `pnpm build:pinocchio:fresh`
(`scripts/build-pinocchio-deploy.sh`) additionally produces
`target/deploy/onchain_academy_pinocchio_fresh.so` with the self-owned
instance id baked in (`--features fresh-id`), gating the id/PDA consts with
`cargo test --features fresh-id` first and restoring the default artifact
afterwards.

> Trident and the CU harness load `target/deploy/onchain_academy.so`;
> `bash scripts/select-program.sh` installs the pinocchio build into that slot
> (and prints the SHA-256). For devnet deploys use the explicit
> `solana program deploy` below.

### Pre-flight gates

Both must be green before a deploy:

```bash
cd onchain-academy
pnpm build:pinocchio   # cargo build-sbf --tools-version v1.54
pnpm test:layout       # byte/discriminator/CPI-wire parity
pnpm test:integration  # single-LiteSVM: all instructions, happy + error paths
pnpm cu:compare        # regenerates tests/CU_COMPARISON.md (local; needs RAM)
```

### Fresh devnet instance (self-owned id)

End-to-end testing without the upstream upgrade authority: deploy the
pinocchio build at its own program id, with your own wallet as both
`authority` and `backend_signer`. A new id means new PDAs — the instance
starts empty (no upstream courses carry over); the IDL and all clients work
unchanged apart from the id.

Identity baked at compile time by `--features fresh-id`, verified by the
`config_pda_consts` host test and `tests/differential/tests/fresh_id_smoke.rs`
(in-SVM initialize + byte-checked Config before any devnet SOL is spent):

| What                  | Value                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| Program id            | `Dsro2Cd9Mhgk8L71imh3LLPwYU5PU8hvBY5HEcPrcx5u`                                                                  |
| Program keypair       | `onchain-academy/wallets/pinocchio-program-devnet-v2.json` (gitignored)                                         |
| Config PDA (bump 254) | `E9GVGKbyoWNSf9B1iR8gNVecwDwqnzNbUxcBzVCVSXan`                                                                  |
| XP mint               | `BUk5izZcRompFe2da1yv9BLcMLBEEyg7JCvS8nQYoHHd` (keypair: `onchain-academy/wallets/xp-mint-keypair.json`, gitignored) |

```bash
cd onchain-academy

# 1. Build the deploy artifact. (The TS helper scripts load the committed IDL
#    at onchain-academy/idl/ — no extra build step needed.)
pnpm build:pinocchio:fresh

# 2. Deploy under your own wallet — fee payer + upgrade authority default to
#    ~/.config/solana/id.json. Rent for the ~200 KB binary is ~1.5 SOL.
solana program deploy target/deploy/onchain_academy_pinocchio_fresh.so \
  --program-id wallets/pinocchio-program-devnet-v2.json \
  --url devnet

# 3. Initialize: creates Config + the Token-2022 XP mint (from
#    wallets/xp-mint-keypair.json) + your backend MinterRole.
#    The public endpoint rate-limits aggressively — any provider URL works
#    here (e.g. Helius devnet with your key).
export ACADEMY_PROGRAM_ID=Dsro2Cd9Mhgk8L71imh3LLPwYU5PU8hvBY5HEcPrcx5u
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
export ANCHOR_WALLET=~/.config/solana/id.json
# scripts/initialize.ts reads ../wallets/xp-mint-keypair.json relative to CWD —
# run it from onchain-academy/scripts/. (No ts-node in deps; tsx works.)
(cd scripts && npx tsx initialize.ts)

# 4. E2E canary — every scripts/*.ts helper honors ACADEMY_PROGRAM_ID:
npx tsx scripts/create-mock-course.ts
npx tsx scripts/e2e-flow.ts   # enroll → lessons → finalize → close
npx tsx scripts/check-xp.ts
# Credential leg: create a track collection first (§10,
# create-mock-track.ts) and pass it to e2e-flow.ts / issue-credential.ts.

# 5. Verify
solana program show Dsro2Cd9Mhgk8L71imh3LLPwYU5PU8hvBY5HEcPrcx5u --url devnet
```

Deploying the DEFAULT-flavor `.so` at this id cannot corrupt anything: the
baked-id self-check rejects every instruction with
`DeclaredProgramIdMismatch` (4100) — proven in `fresh_id_smoke.rs`. Seeing
4100 on devnet means the wrong artifact; redeploy `…_fresh.so`. The reverse
mix-up is impossible (the fresh-flavor binary never holds the upstream id).

Frontend against the fresh instance: point `NEXT_PUBLIC_PROGRAM_ID` and
`NEXT_PUBLIC_XP_MINT_ADDRESS` (§12) at the table values above.
