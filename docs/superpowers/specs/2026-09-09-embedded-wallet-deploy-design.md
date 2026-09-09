# Deploy lessons for embedded-wallet learners

Status: draft for owner approval. Date: 2026-09-09.

## Problem

`lesson-b2s-your-first-solana-program` (btc-to-sol, lesson 10 of 15) is a `code` block with `buildType: buildable, deployable: true`. Since 2026-09-09 the build server compiles it again, so learners reach 3/3 tests. Nobody can submit it, for two stacked reasons.

1. The Submit button (`components/editor/challenge-runner.tsx:924`) requires a `superteam:deploy-complete` event, which only `DeployPanel` fires. `DeployPanel` is mounted only by the `deployed-program-card` block (`lessons/[id]/blocks/deployed-program-card-block.tsx`). No live lesson carries that block; this lesson is `prose, code, quiz`. So the deploy panel never renders and Submit never appears, for any wallet kind. Nothing in content-lint catches a `deployable` code block with no card after it (gate 13a only checks `produces`/`consumes` ordering).
2. Even with the card present, `DeployPanel` (`components/deploy/deploy-panel.tsx:137`) and `WalletFundingCard` (`components/deploy/wallet-funding-card.tsx:17`) take their signer only from `useWallet()`. A learner who signed in through Dynamic (`profiles.wallet_kind = 'embedded'`, the default for social sign-ups) has no wallet-adapter key, so Deploy is `disabled={!publicKey}` forever. Enroll was taught to sign through Dynamic in #1004; deploy was not. The deploy also needs devnet SOL for rent and fees, and an embedded wallet starts at zero.

Evidence: prod has zero completions of this lesson and zero `deployed_programs` rows for the owner (embedded). The owner's screenshot on 2026-09-09 shows 3/3 passing with no Submit and no deploy panel.

## Goals

- A learner with an embedded wallet and zero SOL completes a deployable lesson end to end: build, fund, deploy, submit, XP.
- Extension-wallet learners keep today's behaviour.
- No new server trust: the deploy is still signed and paid by the learner's wallet, and `/api/deploy/save` still attributes to the linked wallet.
- A deployable lesson that cannot be completed fails content lint.

## Non-goals

- Sponsored (backend-paid) deploys. Recorded as an alternative; not this change.
- Server-paid SOL top-ups. The devnet faucet is the funding source, as in the `wallet-funding` block today.
- Changing the deploy protocol (Loader v3 buffer upload in `packages/deploy`).

## Design

Three PRs, in this order. A and B are independent; C lands last.

### A. Content: make the lesson completable (academy-courses)

Add two blocks to `courses/btc-to-sol-evolution/lessons/your-first-solana-program/lesson.yaml`:

```yaml
- key: fund
  type: wallet-funding
  produces: funded-wallet
- key: ping-program # existing, add:
  consumes: [funded-wallet]
- key: deployed
  type: deployed-program-card
  consumes: [deployed-program]
```

Order: intro, fund, ping-program, deployed, check. `slots.lock.json` is untouched (blocks are not slots). Prose in `intro.md` gets one paragraph on what the deploy costs (real rent for this binary, not the stale "2 SOL per airdrop" line the catalog spec already flags). Then a monorepo `content.lock` bump.

### B. Lint: a deployable block must be followed by a card (monorepo, `packages/content-lint`)

New check, same family as gate 13a: for every `code` block with `deployable: true`, the same lesson must contain a later `deployed-program-card` block. Error message names the lesson and says the lesson is uncompletable without it. Add the fixture pair (passing and failing). This is what would have caught the lesson at authoring time.

### C. App: deploy and funding sign through the embedded wallet (monorepo, sensitive lane)

**C1. One signer for both wallet kinds.** New hook `useDeploySigner()` in `apps/web/src/hooks/use-deploy-signer.ts` returning:

```ts
{ status: "resolving" | "none" | "expired" | "ready",
  signer: WalletAdapter | null,          // packages/deploy `WalletAdapter`
  kind: "adapter" | "embedded" | null }
```

Resolution, mirroring `use-on-chain-enroll.ts`:

- wallet-adapter `publicKey` present: `kind: "adapter"`, signer = the adapter's `publicKey`, `signTransaction`, `signAllTransactions`.
- else `useDynamicSessionState()`:
  - `loading` → `resolving`
  - `valid` → `kind: "embedded"`, signer = `{ publicKey: parseWalletAddress(account.address), signTransaction: tx => signWithDynamicWallet(tx, account), signAllTransactions: txs => signAllWithDynamicWallet(txs, account) }`
  - `expired` → `expired`
  - `none` → `none`
- `isDynamicEnabled()` false → adapter only, exactly today's behaviour (kill switch, same contract as enroll).

**C2. Batch signing helper.** `signAllWithDynamicWallet(txs, account)` in `lib/dynamic/solana.ts`, wrapping the SDK's `signAllTransactions` (present in `@dynamic-labs-sdk/solana` 1.27.1) with the same version-boundary cast and the same `isDynamicSessionExpiredError` semantics as `signWithDynamicWallet`. Returns the signed transactions in order.

**C3. Batch size follows the signer.** `deployProgram` and `resumeDeployment` in `packages/deploy/src/deploy.ts` get an optional `batchSize` (default stays 50). Every batch shares one blockhash fetched before signing, and a blockhash lives roughly 60 to 90 s on devnet. Fifty MPC signatures in one call is an unmeasured cost. The builder measures `signAllTransactions` latency for 10, 25 and 50 transactions against a real Dynamic session and picks the embedded batch size so signing finishes well inside the window (target under 20 s per batch). The number and the measurement go in the PR body. Resume uses the same size. The measured size can go stale (an SDK upgrade, a provider change on Dynamic's side) — a too-large batch then degrades to the existing resend/resume path rather than becoming a security issue.

**C4. Deploy panel uses the signer.** `DeployPanel` replaces `useWallet()` with `useDeploySigner()`:

- `status: resolving` → button disabled with a resolving label, never "connect a wallet".
- `expired` → render `LinkedWalletPrompt variant="reauth"` (the enroll card) in place of the button; on return the saved deployment state (`sessionStorage`, already exists) lets the learner resume.
- `none` → today's connect prompt.
- `ready` → button enabled; `handleDeploy`/`handleResume` pass `signer`.
- Mismatch warning: `connectedWallet` comes from `signer.publicKey`; the `#1198` heal guarantees an embedded account equals the linked wallet, so a mismatch here is real and stays a warning.
- `isDynamicSessionExpiredError` thrown mid-deploy → panel state `paused` with the reauth card, not a generic error. Uploaded chunks are preserved by the existing resume path (buffer authority is the payer, which is the same key after re-auth).
- The wallet-scoped cache prefix (`walletPrefix`) derives from `signer.publicKey`, so cache isolation holds for embedded wallets.

**C5. Funding gate inside the panel.** Before enabling Deploy, the panel checks the balance can cover the deploy:

- `estimateDeployCost(connection, programLen)` added to `packages/deploy`: buffer rent + program account rent + programdata rent (Loader v3: `programLen * 2 + headers`, the same sizes `deployProgram` already creates) + fees (`(chunks + 2) * (base fee + priority fee)`), times 1.2. Exported so the panel and a test can call it.
- If balance < estimate, the panel renders `WalletFundingCard` inline above the button with the shortfall, and Deploy stays disabled until a re-read balance covers it. `WalletFundingCard` moves from `useWallet()` to `useDeploySigner()` for the address, balance and `createAirdropRequest` target. It keeps the 2 SOL airdrop, the cooldown, and the faucet.solana.com fallback; the fallback now shows the address with a copy button, because an embedded learner has nowhere else to see it.
- When the lesson also carries a standalone `wallet-funding` block (PR A), that block funds first and the inline card simply never appears. The inline check is the safety net for lessons authored without one.

**C6. Telemetry.** `trackEvent("deploy_started", { signerKind, batchSize })`, `deploy_funding_required` with the shortfall, `deploy_completed` with duration and chunk count, `deploy_session_expired`. These are the numbers that tell us whether the embedded path works in the field.

**C7. Unchanged.** `/api/deploy/save` (attributes to `profiles.wallet_address`), `verify-program-deploy`, the credential gate, the build server, the loader protocol, `programKeypairSecret` handling.

## Error handling

| situation                                  | behaviour                                                                                                                        |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Dynamic session expired before deploy      | reauth card, no toast, deploy state untouched                                                                                    |
| expired mid-batch                          | paused + reauth card; resume continues from last uploaded chunk                                                                  |
| faucet 429                                 | existing cooldown + faucet link with copyable address                                                                            |
| balance short after airdrop                | card stays, shortfall updated, Deploy disabled                                                                                   |
| MPC batch slower than the blockhash window | measured up front (C3); if a batch still expires, the existing resend loop reports it and resume re-signs with a fresh blockhash |
| adapter and Dynamic both present           | adapter wins, as in enroll                                                                                                       |

## Testing

- `use-deploy-signer` unit tests: adapter present; Dynamic valid; loading; expired; none; kill switch off with a Dynamic session present.
- `signAllWithDynamicWallet`: order preserved, expiry error mapped, cast boundary.
- `estimateDeployCost`: known binary length gives the expected lamports from a mocked `getMinimumBalanceForRentExemption`.
- `packages/deploy`: `batchSize` honoured for upload and resume; default unchanged.
- `DeployPanel`: resolving disables; expired shows reauth; ready with embedded signer calls `deployProgram` with that signer and the embedded batch size; mismatch warning uses signer key; funding card appears when short and disappears when funded; session-expired error mid-deploy goes to paused + reauth. Existing tests keep passing.
- `WalletFundingCard`: renders for an embedded signer; airdrop targets its address.
- content-lint: new check fixtures.
- Browser probe by the gate: sign in with a fresh Google account (embedded), open the lesson, build, fund, deploy, submit, confirm XP and the `deployed_programs` row. A rendered-page probe, per the UI review rule.

## Review

PR C touches wallet signing and on-chain spend, so it gets an independent adversarial gate before merge. Points for the gate: the embedded signer cannot be used to sign for a wallet other than the session's; the cache prefix cannot collide across users; the funding card cannot target a different address than the signer; the kill switch degrades to today's behaviour; no new server route; the 1.2x cost buffer in `estimateDeployCost` (C5) holds against real devnet priority-fee spikes, not just the mocked test case.

## Rollout

Behind the existing `isDynamicEnabled()` flag. Order: B (lint) and A (content) can merge any time, A's lock bump after C is live so the lesson is not exposed with a panel that still ignores embedded wallets. Verify with the owner's own account, then watch `deploy_completed` by `signerKind` for a week. Once PR C lands, `docs/ARCHITECTURE.md` gets a `useDeploySigner()` mention next to the existing enroll-signing pattern.

## Alternatives considered

- Sponsored deploy (backend pays and sets the learner as upgrade authority): no SOL and no batch signing, but spends from the hot key per learner and changes the lesson's claim. Kept as the fallback if MPC batch signing proves too slow for the blockhash window.
- App auto-mounts the deploy panel under any deployable code block: hides a content mistake instead of catching it, and contradicts the content standard's explicit widgets. The lint rule is the fix.

## Open items

- MPC batch signing latency (C3) is the one unknown that could change the shape. It is measured inside PR C before the batch size is fixed.
- Does the title "code you can never edit" mean the deploy should burn the upgrade authority? `deployProgram` does not today. Out of scope here; worth a separate content or protocol decision.
