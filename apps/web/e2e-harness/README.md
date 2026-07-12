# SP3-C manual harnesses (INERT — not part of the test suite)

These files carry the `.harness.ts` extension on purpose. Vitest's include glob is
`**/*.{test,spec}.?(c|m)[jt]s?(x)` (the default — `vitest.config.ts` sets no `include`), which
`.harness.ts` cannot match, so `pnpm test` never collects or runs them. Verified: `vitest list`
reports 63 collected files and zero harnesses. **To run one, rename it to `*.test.ts`** (and rename
it back / leave it uncommitted afterwards — do not land a renamed copy).

## `negative-path.harness.ts` — the #427 regression proof

**Rename to `.test.ts` and run this AFTER #427 is merged under this branch — the System-program case
must now be REFUSED PRE-SEND; before #427 it passed validation and was stopped only by the dead RPC.**
That is the whole point of the file: on the pre-#427 branch state it recorded three genuine
pre-send refusals from `admin-signer.deployCoursePda` (missing `creatorWallet`, unparseable
`creatorWallet`, off-curve `creatorWallet`), while the System-program creator
(`11111111111111111111111111111111`) sailed past every validation check and failed only with
`failed to get recent blockhash: fetch failed` — i.e. the network, not the code, is what prevented a
transaction. Once #427's denylist lands, that fourth case must fail with an explicit refusal
message from the signer instead. If it still reports a blockhash/network error, the denylist did not
take effect and the gap is still open.

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
