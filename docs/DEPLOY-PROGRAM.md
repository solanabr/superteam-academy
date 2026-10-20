> Last synced: 2026-10-19

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
(4100). Seeing 4100 on devnet means you deployed the wrong artifact: redeploy
`target/deploy-devnet/` from the CI artifact. The reverse mix-up is impossible, since the
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

Every write in this runbook goes through a Helius devnet RPC, never the public
devnet endpoint (see §5). Keep the URL in an environment variable so the API key
stays out of commands and logs. `solana config set` and `solana config get` print
the full RPC URL, key included, so silence them, and in a Claude Code session run
them yourself rather than through Claude (the repo's settings deny both to
Claude):

```bash
export HELIUS_DEVNET_RPC="https://devnet.helius-rpc.com/?api-key=<your key>"

solana config set --url "$HELIUS_DEVNET_RPC" > /dev/null
solana config set --keypair wallets/signer.json > /dev/null

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

## 4. Get the deploy artifact

Deploy the binary CI built, not one you built locally. A Mac build of the same
source differs from the CI build in `.text`, so only the CI artifact matches the
published hashes. Every push to `main` runs the `verifiable-build` job, which
uploads both flavors with their hashes:

```bash
RUN=$(gh run list --branch main --workflow ci.yml --status success --limit 1 --json databaseId --jq '.[0].databaseId')
gh run download "$RUN" -n verifiable-build -D ~/academy-artifact
cd ~/academy-artifact
shasum -a 256 target/deploy-devnet/onchain_academy_pinocchio.so   # must equal program-hash-devnet.txt
cat program-hash-devnet.txt
```

`target/deploy-devnet/` holds the devnet (`fresh-id`) flavor and `target/deploy/`
the default one. The artifact paths in sections 5 and 8 assume you run them from
`~/academy-artifact`.

For local testing or a throwaway instance you can still build it yourself:
`pnpm build:pinocchio:fresh` in `onchain-academy/` gates on
`cargo test --features fresh-id`, then emits
`target/deploy/onchain_academy_pinocchio_fresh.so`. Don't upgrade the shared
devnet program from that build.

> **`edition2024` or dependency-resolution errors**: pin the offending crates and
> rebuild.
>
> ```bash
> cargo update -p blake3 --precise 1.7.0
> cargo update -p rmp --precise 0.8.14
> cargo update -p rmp-serde --precise 1.3.0
> ```

## 5. Deploy

A first deploy of a new instance signs with the program's own keypair:

```bash
solana program deploy target/deploy-devnet/onchain_academy_pinocchio.so \
  --program-id wallets/pinocchio-program-devnet-v2.json \
  --url "$HELIUS_DEVNET_RPC"
```

Upgrading the live devnet program uses its address and the upgrade authority
instead. The binary must fit the program account (213,024 bytes today); if it
doesn't, run `solana program extend` first.

```bash
solana program deploy target/deploy-devnet/onchain_academy_pinocchio.so \
  --program-id Dsro2Cd9Mhgk8L71imh3LLPwYU5PU8hvBY5HEcPrcx5u \
  --upgrade-authority <upgrade-authority-keypair> \
  --url "$HELIUS_DEVNET_RPC"
```

Fee payer and upgrade authority default to `~/.config/solana/id.json`.

> **Helius only, never the public devnet endpoint.** A ~213 KB program deploy is
> hundreds of sequential write transactions, and the public endpoint has
> corrupted and failed deploys part-way through. In Claude Code sessions the
> repo's `guard-solana` hook blocks program writes to any other endpoint.
>
> If a deploy does fail part-way it leaves a funded buffer account behind.
> Reclaim the rent before retrying:
>
> ```bash
> solana program close --buffers --url "$HELIUS_DEVNET_RPC" --keypair wallets/signer.json
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
export ANCHOR_PROVIDER_URL="$HELIUS_DEVNET_RPC"
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
> `create_course` — there is no `update_course` setter, and recovery needs a
> full recreate, which on mainnet is only allowed while nobody is enrolled.
> Confirm real instructor wallets and the finalized track ladder first.

## 8. Verify

```bash
solana program show $ACADEMY_PROGRAM_ID --url "$HELIUS_DEVNET_RPC"

# Byte-verify: the deployed program must match the CI hash. The dump is the
# whole program account, so hash only the binary's length.
solana program dump $ACADEMY_PROGRAM_ID /tmp/deployed.so --url "$HELIUS_DEVNET_RPC"
head -c "$(wc -c < target/deploy-devnet/onchain_academy_pinocchio.so)" /tmp/deployed.so | shasum -a 256
cat program-hash-devnet.txt

npx tsx scripts/fetch-config.ts

spl-token display <XP_MINT_ADDRESS> \
  --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
```

The live fresh instance, for comparison:

| What       | Value                                                     |
| ---------- | --------------------------------------------------------- |
| Program id | `Dsro2Cd9Mhgk8L71imh3LLPwYU5PU8hvBY5HEcPrcx5u`            |
| Config PDA | `E9GVGKbyoWNSf9B1iR8gNVecwDwqnzNbUxcBzVCVSXan` (bump 254) |
| XP mint    | `BUk5izZcRompFe2da1yv9BLcMLBEEyg7JCvS8nQYoHHd`            |
| Room       | 213,024 bytes for the binary                              |

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

The full annotated env list is [`.env.example`](../.env.example) at the repo root.

---

## Reproducible builds

`.github/workflows/ci.yml` runs a `verifiable-build` job and a `publish-hash`
job that writes the SHA-256 of the toolchain-reproducible build to a dedicated
`program-hash` branch on every change. [PROGRAM-HASH.md](./PROGRAM-HASH.md) is
the human-readable spec and entry point; it is deliberately not CI-updated on
`main`, because branch protection forbids the bot from pushing there.

The CU harness loads `target/deploy/onchain_academy.so`;
`bash scripts/select-program.sh` installs the Pinocchio build into that slot and
prints its SHA-256. Devnet deploys use the explicit `solana program deploy` path
above instead.

## Troubleshooting

| Symptom                                        | Cause                                                                              |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| `DeclaredProgramIdMismatch` (4100)             | Wrong artifact for this id. Redeploy `target/deploy-devnet/` from the CI artifact. |
| `Account already in use` / already initialized | The Config PDA exists. You already initialized, or you are reusing a live id.      |
| Deploy stalls or fails part-way                | Public RPC rate limit. Use a provider URL, then `solana program close --buffers`.  |
| `edition2024` / `rmp-serde` build errors       | Edition-2024 resolver conflict. Pin the crates as shown in §4.                     |
| Insufficient SOL                               | Budget ~2 SOL for the deploy plus rent. Airdrop twice or use the web faucet.       |

---

## Before mainnet

Mainnet deploys, upgrades and authority changes are run by the owner, after this
checklist and with explicit confirmation. Claude Code sessions can't run them:
the `guard-solana` hook blocks program writes to mainnet.

### Program and deploy

- [ ] All suites green: both `cargo test` flavors, `pnpm test:integration`, and a
      fuzz run of 10+ minutes.
- [ ] Security audit completed.
- [ ] The artifact you deploy matches the published reproducible-build hash
      ([PROGRAM-HASH.md](./PROGRAM-HASH.md)).
- [ ] CU numbers checked against `onchain-academy/tests/CU_BASELINE.pinocchio.md`.
- [ ] Metaplex Core credential flow tested end to end on devnet.
- [ ] Devnet testing over several days.
- [ ] Frontend Lighthouse: Performance 90+, Accessibility 95+, Best Practices
      95+, SEO 90+.
- [ ] The owner's explicit confirmation.

### Instructor credibility and track ladder

`Course.creator`, `Course.track_id` and `Course.track_level` are set once at
`create_course` and have no on-chain setter. The only fix is close and recreate,
and the recreated course gets a new generation that rejects every existing
enrollment, so enrolled learners lose their progress in that course. On mainnet
every course must be right before learners enroll.

The source of truth for all three fields is the course content doc
(`creatorWallet`, `trackId`, `trackLevel`), passed straight through the admin
sync route to `create_course`. There is no platform-authority fallback: a
missing or invalid creator wallet fails the deploy.

Per course, before its first mainnet `create_course`:

- [ ] The instructor wallet is confirmed with the instructor: a wallet they
      control, not a placeholder and not the platform authority.
- [ ] The content doc's `creatorWallet` is that wallet, and it's a valid
      on-curve address.
- [ ] The credential track ladder is final, and every course's `trackId` /
      `trackLevel` matches it, with no unset defaults where a real rung is meant.
- [ ] Each creator wallet is linked to a public academy profile, so course and
      certificate pages show a real instructor. Identity comes only from the
      `public_profiles` view, resolved from `course.creator` by
      `resolvePublicProfileByWallet` (`api/content/instructor-wallet`).
- [ ] The academy-courses contributor docs describe the real wallet-to-instructor
      flow.

### Launch day: verify every course before learners arrive

The admin deploy refuses to create a mainnet course whose `trackId` or
`trackLevel` is unset, or whose creator is the platform authority or backend
signer (`COURSE_IDENTITY_001`). It treats the cluster as mainnet unless the RPC
answers with devnet's genesis hash, or is loopback and answers with a localnet
genesis, so a misconfigured server refuses rather than slipping through. If the
genesis hash can't be read at all it refuses with `COURSE_IDENTITY_002`; retry.

Track is the learning path; level is the course's position in it:

- Comece aqui = track 1: Speedrun 1, Visão Geral 2, BTC to SOL 3
- Hackathon = track 2: Hackathon Expert 1
- Construa e publique = track 3: Rust and TS Fundamentals 1, Payments and
  Commerce 2, Digital Assets 3, Mastering Anchor v2 4
- Pílula is not created on mainnet.

In this order, before the platform opens to learners:

- [ ] Create every mainnet course.
- [ ] Read each Course PDA back (the admin deploy diff, or
      `onchain-academy/scripts/fetch-course.ts <course-id>`) and check creator,
      track and level against the ladder above. On mainnet `fetch-course.ts`
      needs `ANCHOR_PROVIDER_URL` set to a mainnet RPC (plus any `ANCHOR_WALLET`
      keypair) and `ACADEMY_PROGRAM_ID` if the mainnet program id differs from
      the address in `idl/onchain_academy.json`.
- [ ] Recreate any course with a wrong creator, track or level now, while nobody
      is enrolled. The admin recreate refuses on mainnet once a course has an
      enrollment, because a recreate wipes enrolled learners' progress.
- [ ] Only then, on a course already confirmed correct, the owner enrolls with
      his own account, finishes it, and checks that the credential shows the
      right instructor, track and level. That enrollment makes the course
      non-recreatable on mainnet, which is why it comes last.
