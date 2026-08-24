> Last synced: 2026-08-24

# Deploying the program to devnet

Deploy your own instance of `onchain_academy` on devnet: full authority, no
shared keys, a clean environment to test a frontend against.

The program is **Pinocchio-only**. The Anchor implementation was deleted, along
with `Anchor.toml` — there is no `anchor build`, no `anchor deploy`, and no
`anchor account` in this runbook. You build with `cargo build-sbf` and deploy
with `solana program deploy`.

Companion docs: [SPEC.md](./SPEC.md) is the authoritative program specification;
[PINOCCHIO-MIGRATION.md](./PINOCCHIO-MIGRATION.md) explains what the port
changed for clients; [ARCHITECTURE.md](./ARCHITECTURE.md) covers how the app
uses it.

---

## Prerequisites

| Tool       | Version          | Note                                          |
| ---------- | ---------------- | --------------------------------------------- |
| Rust       | 1.89+            | Pinocchio 0.11.2 requires it                  |
| Solana CLI | Agave 2.x or 3.x | Downloads platform-tools `v1.54` on demand    |
| Node.js    | 20               | For the TypeScript helper scripts (`npx tsx`) |
| pnpm       | 10               | Pinned by `packageManager` at the repo root   |

```bash
rustc --version && solana --version && node --version
```

## Two program-id flavors

The program id is baked in at compile time, so which artifact you deploy matters.

| Build                        | Program id                                     | Use                                                                            |
| ---------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------ |
| `pnpm build:pinocchio`       | `7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V` | Default. The upstream id the IDL declares; what every parity gate runs against |
| `pnpm build:pinocchio:fresh` | `Dsro2Cd9Mhgk8L71imh3LLPwYU5PU8hvBY5HEcPrcx5u` | `--features fresh-id`. The self-owned devnet instance — deploy this one        |

A new id means new PDAs, so a fresh instance starts empty. Every client works
unchanged apart from the id.

Deploying the **default** artifact at the fresh id cannot corrupt anything: the
baked-id self-check rejects every instruction with `DeclaredProgramIdMismatch`
(4100). Seeing 4100 on devnet means you deployed the wrong artifact — rebuild
and redeploy `…_fresh.so`. The reverse mix-up is impossible, since the
fresh-flavor binary never carries the upstream id.

---

## 1. Keypairs

All keypairs live in `wallets/` (gitignored).

```bash
mkdir -p wallets

# Deployer / authority. Skip if you already have a CLI wallet to use.
solana-keygen new --outfile wallets/signer.json

# Program keypair — determines the program id. `grind` for a vanity address.
solana-keygen new --outfile wallets/program-keypair.json

# XP mint keypair — a signer to `initialize`, not a PDA.
solana-keygen new --outfile wallets/xp-mint-keypair.json
```

The already-provisioned fresh instance uses
`onchain-academy/wallets/pinocchio-program-devnet-v2.json` and
`onchain-academy/wallets/xp-mint-keypair.json` (both gitignored). Generating a
genuinely new id means changing the baked constant in `src/consts.rs` and
rebuilding, not just swapping the keypair file.

## 2. Fund the deployer

Deployment costs roughly 1.5–2 SOL for the ~213 KB binary, plus about 0.01 SOL
of rent for `initialize`.

```bash
solana config set --url devnet
solana config set --keypair wallets/signer.json

solana airdrop 2
solana airdrop 2
solana balance
```

If the CLI airdrop is rate-limited, use <https://faucet.solana.com>.

## 3. Pre-flight gates

Both must be green before you spend devnet SOL:

```bash
cd onchain-academy

pnpm build:pinocchio    # cargo build-sbf --tools-version v1.54
pnpm test:layout        # host tests: byte/discriminator/CPI-wire parity
pnpm test:integration   # LiteSVM: every instruction, happy and error paths
```

`fresh_id_smoke.rs` inside the integration suite runs `initialize` in-SVM and
byte-checks the resulting Config — a fresh-id deploy is proven before it touches
devnet.

## 4. Build the deploy artifact

```bash
cd onchain-academy
pnpm build:pinocchio:fresh
```

`scripts/build-pinocchio-deploy.sh` gates on `cargo test --features fresh-id`
first, emits `target/deploy/onchain_academy_pinocchio_fresh.so`, and restores the
default artifact afterwards.

> **`edition2024` or dependency-resolution errors**: pin the offending crates and
> rebuild.
>
> ```bash
> cargo update -p blake3 --precise 1.7.0
> cargo update -p rmp --precise 0.8.14
> cargo update -p rmp-serde --precise 1.3.0
> ```

## 5. Deploy

```bash
solana program deploy target/deploy/onchain_academy_pinocchio_fresh.so \
  --program-id wallets/pinocchio-program-devnet-v2.json \
  --url devnet
```

Fee payer and upgrade authority default to `~/.config/solana/id.json`.

> **Use a dedicated RPC, not the public devnet endpoint.** A ~213 KB program
> deploy is hundreds of sequential write transactions, and the public endpoint
> rate-limits aggressively enough to fail one part-way through. Pass a provider
> URL (Helius devnet with your key, for example) to `--url`.
>
> If a deploy does fail part-way it leaves a funded buffer account behind.
> Reclaim the rent before retrying:
>
> ```bash
> solana program close --buffers --url devnet --keypair wallets/signer.json
> ```

## 6. Initialize

One-time. It creates the Config PDA, creates the XP mint (Token-2022,
NonTransferable + PermanentDelegate + MetadataPointer, 0 decimals), and
auto-registers the authority as a `MinterRole` labelled `backend` with an
unlimited cap. On devnet the deployer is both `authority` and `backend_signer`.

`scripts/initialize.ts` reads `../wallets/xp-mint-keypair.json` relative to the
working directory, so run it from `scripts/`. There is no `ts-node` in the
dependency tree — use `tsx`.

```bash
cd onchain-academy

export ACADEMY_PROGRAM_ID=Dsro2Cd9Mhgk8L71imh3LLPwYU5PU8hvBY5HEcPrcx5u
export ANCHOR_PROVIDER_URL=<your devnet RPC>
export ANCHOR_WALLET=~/.config/solana/id.json

(cd scripts && npx tsx initialize.ts)
```

A second run fails with "already initialized" — expected. The Config PDA's init
constraint enforces single initialization.

Token metadata is deferred: `initialize` sets the MetadataPointer extension but
leaves the TokenMetadata initialization to a separate client transaction (an
Agave 3.0 CPI-realloc restriction). This is cosmetic — the mint works fully for
XP without it.

## 7. Smoke-test end to end

Every `scripts/*.ts` helper honours `ACADEMY_PROGRAM_ID`.

```bash
npx tsx scripts/create-mock-course.ts
npx tsx scripts/e2e-flow.ts        # enroll → lessons → finalize → close
npx tsx scripts/check-xp.ts
```

For the credential leg, create a track collection first
(`scripts/create-mock-track.ts`) and pass it to `e2e-flow.ts` /
`issue-credential.ts`. Metaplex Core is already live on devnet — no fixtures
needed.

> **Before any mainnet course creation.** `create-mock-course.ts` uses a
> placeholder creator wallet and default `trackId` / `trackLevel`.
> `Course.creator`, `track_id`, and `track_level` are **immutable** after
> `create_course` — there is no `update_course` setter, recovery on devnet needs
> a full recreate, and there is no recovery at all on mainnet. Confirm real
> instructor wallets and the finalized track ladder first.

## 8. Verify

```bash
solana program show $ACADEMY_PROGRAM_ID --url devnet

npx tsx scripts/fetch-config.ts

spl-token display <XP_MINT_ADDRESS> \
  --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
```

The live fresh instance, for comparison:

| What        | Value                                                     |
| ----------- | --------------------------------------------------------- |
| Program id  | `Dsro2Cd9Mhgk8L71imh3LLPwYU5PU8hvBY5HEcPrcx5u`            |
| Config PDA  | `E9GVGKbyoWNSf9B1iR8gNVecwDwqnzNbUxcBzVCVSXan` (bump 254) |
| XP mint     | `BUk5izZcRompFe2da1yv9BLcMLBEEyg7JCvS8nQYoHHd`            |
| Binary size | 213,024 bytes                                             |

## 9. Point the frontend at it

```env
NEXT_PUBLIC_PROGRAM_ID=<your program id>
NEXT_PUBLIC_XP_MINT_ADDRESS=<xp mint from the initialize output>
NEXT_PUBLIC_SOLANA_NETWORK=devnet

PROGRAM_AUTHORITY_SECRET=<JSON array of 64 keypair bytes>
BACKEND_SIGNER_SECRET=<JSON array of 64 keypair bytes>
```

On devnet the two secrets can be the same keypair; in production they are
separate keys. Both are **JSON byte arrays**, the same format
`solana-keygen` writes — not base58 strings. `getProgramId()` throws when
`NEXT_PUBLIC_PROGRAM_ID` is unset rather than silently defaulting.

The full annotated env list is the `## Environment Variables` block in
[`apps/web/CLAUDE.md`](../apps/web/CLAUDE.md).

---

## Reproducible builds

`.github/workflows/ci.yml` runs a `verifiable-build` job and a `publish-hash`
job that writes the SHA-256 of the toolchain-reproducible build to a dedicated
`program-hash` branch on every change. [PROGRAM-HASH.md](./PROGRAM-HASH.md) is
the human-readable spec and entry point; it is deliberately not CI-updated on
`main`, because branch protection forbids the bot from pushing there.

Trident and the CU harness load `target/deploy/onchain_academy.so`;
`bash scripts/select-program.sh` installs the Pinocchio build into that slot and
prints its SHA-256. Devnet deploys use the explicit `solana program deploy` path
above instead.

## Troubleshooting

| Symptom                                        | Cause                                                                             |
| ---------------------------------------------- | --------------------------------------------------------------------------------- |
| `DeclaredProgramIdMismatch` (4100)             | Wrong artifact for this id. Rebuild with `build:pinocchio:fresh` and redeploy.    |
| `Account already in use` / already initialized | The Config PDA exists. You already initialized, or you are reusing a live id.     |
| Deploy stalls or fails part-way                | Public RPC rate limit. Use a provider URL, then `solana program close --buffers`. |
| `edition2024` / `rmp-serde` build errors       | Edition-2024 resolver conflict. Pin the crates as shown in §4.                    |
| Insufficient SOL                               | Budget ~2 SOL for the deploy plus rent. Airdrop twice or use the web faucet.      |
