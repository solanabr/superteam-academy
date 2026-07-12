# SP3-C manual harnesses (INERT — not part of the test suite)

These files carry the `.harness.ts` extension on purpose. Vitest's include glob is
`**/*.{test,spec}.?(c|m)[jt]s?(x)` (the default — `vitest.config.ts` sets no `include`), which
`.harness.ts` cannot match, so `pnpm test` never collects or runs them. Verified: `vitest list`
reports 63 collected files and zero harnesses. **To run one, rename it to `*.test.ts`** (and rename
it back / leave it uncommitted afterwards — do not land a renamed copy).

## `negative-path.harness.ts` — the #427 regression proof

**#427 is merged and this branch is rebased onto it — VERIFIED: the System-program case is now
REFUSED PRE-SEND.** Rename to `.test.ts` to re-run. The file is the standing denylist-regression
guard: on the pre-#427 state it recorded three genuine pre-send refusals from
`admin-signer.deployCoursePda` (missing `creatorWallet`, unparseable `creatorWallet`, off-curve
`creatorWallet`), while the System-program creator (`11111111111111111111111111111111`) sailed past
every validation check and failed only with `failed to get recent blockhash: fetch failed` — i.e. the
network, not the code, prevented a transaction. Post-#427 that fourth case fails with the signer's
denylist message instead, and the test now asserts exactly that (`/denylisted well-known/`, and NOT
`/blockhash|fetch failed/`). If the denylist ever regresses, this test fails loudly rather than
passing on the network stop.

It is safe by construction and self-contained: it generates a **throwaway** `Keypair` for
`PROGRAM_AUTHORITY_SECRET` (never the real authority) and mocks `serverEnv.SOLANA_RPC_URL` to
`http://127.0.0.1:9`, an unreachable port. No transaction can leave the machine regardless of how the
validation behaves, which is exactly what makes the "did validation refuse it, or did the network?"
distinction readable in the error text.

## `devnet-inventory.harness.ts` — read-only devnet inventory

Read-only (`getAccountInfo` via `academy-reads.fetchCourse`; no signer, no writes). For every course
in the committed bundle it prints on-chain `creator` vs the bundle instructor wallet (#400), the
`content_tx_id` vs the bundle SHA (per-course chain drift), and `is_active`. Requires a real
`SOLANA_RPC_URL` in `apps/web/.env.local`. This produced the SP3-C Task 6 legacy-row inventory: all 6
deployed courses have `creator` ≠ instructor wallet, and the legacy creator is the platform authority
itself.
