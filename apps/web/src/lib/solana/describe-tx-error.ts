/**
 * Turn a thrown transaction error into the string we persist as
 * `pending_onchain_actions.last_error`.
 *
 * Thin alias over `serializeQueueError` (lib/solana/queue-errors.ts), which is
 * the single implementation shared by the producers (`queueFailedAction`), the
 * drain and the dry-run script. Kept as its own export because the producers
 * read as "describe this tx error" at their call sites.
 *
 * Originally this handled exactly one upstream mismatch: `@solana/web3.js`
 * 1.95+ changed `SendTransactionError` to a single-options-object constructor,
 * but Anchor's `AnchorProvider.sendAndConfirm` still calls it positionally
 * (both 0.31.1 and 0.32.1), so a transaction that failed AFTER broadcast
 * arrives with the literal `Unknown action 'undefined'` and no signature or
 * logs. That case still gets named; queue-errors.ts adds the program error
 * code, the signature, a log excerpt, and — the reason it moved — a real string
 * for anything thrown that is not an Error, where the old `String(err)` wrote
 * the useless literal `[object Object]`.
 */
export { serializeQueueError as describeTxError } from "./queue-errors";
