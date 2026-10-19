---
description: "Deploy the Pinocchio program to devnet through Helius; mainnet is the owner's"
disable-model-invocation: true
---

Deploy the `onchain-academy` program. The runbook is `docs/DEPLOY-PROGRAM.md`; follow it and stop
at the first failed step.

## Rules

- Devnet only, and only through a Helius devnet RPC. Never use the public endpoint
  (`--url devnet`, `-ud`, or a `solana config` pointing at it): it has corrupted large deploys. The
  `guard-solana` hook blocks program writes to anything but Helius devnet or a local validator.
- Don't print the RPC URL: it carries the API key. `solana config get` and `solana config set` both
  print it, so the user runs those, not you (settings deny them). solana's `-v` flag and its RPC
  error messages also print the full RPC URL, key included. Prefer a Solana CLI config the user
  already pointed at Helius, or `--url "$HELIUS_DEVNET_RPC"` from their environment.
- Mainnet deploys, upgrades and authority changes are run by the owner, after the "Before mainnet"
  checklist in `docs/DEPLOY-PROGRAM.md`. If asked for mainnet, prepare the artifact and the
  checklist status, then hand over the exact commands. Don't run them.

## Devnet

1. **Gate.** From `onchain-academy/`: `pnpm build:pinocchio`, `pnpm test:layout`,
   `pnpm test:integration`. All green or stop.
2. **Artifact.** `pnpm build:pinocchio:fresh` builds
   `target/deploy/onchain_academy_pinocchio_fresh.so` for the self-owned devnet id. Deploying the
   default artifact at the fresh id fails every instruction with `DeclaredProgramIdMismatch` (4100).
3. **Balance.** `solana address` and `solana balance` on the deployer. A deploy needs about 2 SOL.
4. **Deploy.** Ask the user to confirm the program id and keypair, then:

   ```bash
   solana program deploy target/deploy/onchain_academy_pinocchio_fresh.so \
     --program-id wallets/pinocchio-program-devnet-v2.json \
     --url "$HELIUS_DEVNET_RPC"
   ```

   If it fails part-way, reclaim the buffer with
   `solana program close --buffers --url "$HELIUS_DEVNET_RPC"` before retrying.

5. **Byte-verify.** `solana program dump <program-id> <file>` and compare its SHA-256 with the local
   artifact. They must match.
6. **Initialize** only for a brand-new id (`docs/DEPLOY-PROGRAM.md` §6). A second run fails with
   "already initialized", which is expected.
7. **Smoke-test** with `scripts/e2e-flow.ts` and `scripts/check-xp.ts` (§7).

Report the program id, the artifact SHA-256, the dump SHA-256 and the smoke-test result.
