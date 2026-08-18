import { describe, it, expect } from "vitest";
import {
  WALLET_PLACEHOLDER_EMAIL_DOMAIN,
  isWalletPlaceholderEmail,
} from "../wallet-placeholder";

describe("isWalletPlaceholderEmail", () => {
  it("detects the canonical lowercase placeholder", () => {
    expect(
      isWalletPlaceholderEmail("So11111111111111@wallet.superteam-lms.local")
    ).toBe(true);
  });

  it("detects a mixed-case placeholder domain (#921)", () => {
    expect(
      isWalletPlaceholderEmail("So11111111111111@Wallet.Superteam-LMS.LOCAL")
    ).toBe(true);
    expect(isWalletPlaceholderEmail("PUBKEY@WALLET.SUPERTEAM-LMS.LOCAL")).toBe(
      true
    );
  });

  it("matches what the wallet route mints", () => {
    expect(
      isWalletPlaceholderEmail(`AnyPubkey${WALLET_PLACEHOLDER_EMAIL_DOMAIN}`)
    ).toBe(true);
  });

  it("rejects real emails, including lookalikes", () => {
    expect(isWalletPlaceholderEmail("learner@gmail.com")).toBe(false);
    // Suffix check must anchor on the @-domain, not a substring anywhere.
    expect(
      isWalletPlaceholderEmail("a@notwallet.superteam-lms.localhost")
    ).toBe(false);
    expect(
      isWalletPlaceholderEmail("wallet.superteam-lms.local@gmail.com")
    ).toBe(false);
  });

  it("rejects null, undefined and empty", () => {
    expect(isWalletPlaceholderEmail(null)).toBe(false);
    expect(isWalletPlaceholderEmail(undefined)).toBe(false);
    expect(isWalletPlaceholderEmail("")).toBe(false);
  });
});
