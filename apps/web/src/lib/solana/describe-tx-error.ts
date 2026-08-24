/**
 * Turn a thrown transaction error into the string we persist as
 * `pending_onchain_actions.last_error`.
 *
 * Exists because of an upstream mismatch that silently destroys the most
 * useful failures we get. `@solana/web3.js` 1.95+ changed
 * `SendTransactionError` to a single-options-object constructor
 * (`{ action, signature, transactionMessage, logs }`), but Anchor's
 * `AnchorProvider.sendAndConfirm` still calls it positionally —
 * `new SendTransactionError(err.message, logs)` (present in both 0.31.1 and
 * 0.32.1). Destructuring a string yields `undefined` for every field, so the
 * message builder falls to its `default:` branch and the instance carries the
 * literal text below with the real program error, the signature and the logs
 * all dropped on the floor.
 *
 * That branch is reached only when a transaction was BROADCAST and then failed
 * during confirmation — exactly the case an operator most needs the logs for.
 * Three of the stuck achievement rows in prod carry this sentinel as their
 * whole `last_error`, which is what made them look like a queue dispatch bug
 * rather than an ordinary on-chain rejection.
 *
 * Nothing can be recovered from such an instance (the fields were never
 * assigned), so the best available fix is to stop the string from lying: name
 * what actually happened and where the detail went.
 */
const WEB3JS_LOST_CONTEXT_SENTINEL = "Unknown action 'undefined'";

export function describeTxError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  if (message.trim() === WEB3JS_LOST_CONTEXT_SENTINEL) {
    return (
      "on-chain transaction failed after broadcast; program logs unavailable " +
      "(Anchor built SendTransactionError positionally against web3.js's " +
      "options-object constructor, discarding message/signature/logs)"
    );
  }

  return message;
}
