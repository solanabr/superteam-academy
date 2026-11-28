import { randomBytes } from "node:crypto";

/** Gives the random token of one request's data blocks. */
export type BlockTokenSource = () => string;

/** The shape of a token: 32 lowercase hex characters, 128 random bits. */
export const BLOCK_TOKEN_PATTERN = /^[0-9a-f]{32}$/;

/**
 * A new token for the marker lines of a prompt's data blocks (see
 * `partner-prompt.ts`). It comes from the system's cryptographic source, so
 * the text of a request cannot hold it by design.
 */
export const newBlockToken: BlockTokenSource = () =>
  randomBytes(16).toString("hex");
