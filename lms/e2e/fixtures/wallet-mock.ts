import type { Page } from "@playwright/test";
import { randomBytes } from "crypto";

const MOCK_PUBKEY = "BrYpk5VU3k5e1LB7nFMtnhfWGYDy7UfAXHbMR5pAdyAi";

/** Inject a mock Phantom wallet so wallet-dependent UI elements render. */
export async function injectMockWallet(page: Page, pubkey = MOCK_PUBKEY) {
  await page.addInitScript(
    ({ pk }) => {
      const pubkeyBytes = Uint8Array.from(
        atob(
          // base58 → we just supply a 32-byte random array; tests don't verify on-chain
          btoa(String.fromCharCode(...Array.from({ length: 32 }, () => Math.floor(Math.random() * 256)))),
        ),
        (c) => c.charCodeAt(0),
      );

      (window as any).__phantomMockPubkey = pk;

      Object.defineProperty(window, "phantom", {
        value: {
          solana: {
            isPhantom: true,
            publicKey: {
              toBase58: () => pk,
              toBytes: () => pubkeyBytes,
              toString: () => pk,
            },
            isConnected: true,
            connect: async () => ({ publicKey: { toBase58: () => pk } }),
            disconnect: async () => {},
            signMessage: async () => ({ signature: new Uint8Array(64) }),
            signTransaction: async (tx: any) => tx,
            signAllTransactions: async (txs: any[]) => txs,
            on: () => {},
            off: () => {},
          },
        },
        writable: false,
      });
    },
    { pk: pubkey },
  );
}
