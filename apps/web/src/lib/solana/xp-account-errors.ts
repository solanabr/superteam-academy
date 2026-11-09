/**
 * Refusals from `ensureXpTokenAccount`. Kept free of server imports so the
 * routes and the on-chain queue can recognise them without loading the ledger.
 */

/** The reason string routes send to the client for {@link XpAccountClosedError}. */
export const XP_ACCOUNT_CLOSED = "xp_account_closed";

/**
 * The XP token account is missing and the platform already paid for this
 * wallet's one funded create for this mint. The owner recreates the account
 * at their own cost, and the same request then goes through.
 */
export class XpAccountClosedError extends Error {
  readonly code = XP_ACCOUNT_CLOSED;

  constructor(
    /** Base58 owner of the missing account. */
    readonly owner: string,
    /** Base58 XP mint. */
    readonly mint: string
  ) {
    super(
      `XP token account for ${owner} is closed and its platform funding is used`
    );
    this.name = "XpAccountClosedError";
  }
}

/**
 * Another request is funding this wallet's XP token account right now. Nothing
 * was sent; retrying shortly finds the account.
 */
export class XpAccountFundingInFlightError extends Error {
  constructor(readonly owner: string) {
    super(`XP token account funding for ${owner} is already in flight`);
    this.name = "XpAccountFundingInFlightError";
  }
}
