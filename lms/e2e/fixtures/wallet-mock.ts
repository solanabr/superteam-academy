import type { Page } from "@playwright/test";

const MOCK_PUBKEY = "BrYpk5VU3k5e1LB7nFMtnhfWGYDy7UfAXHbMR5pAdyAi";

/**
 * Inject a mock Phantom wallet that auto-connects through @solana/wallet-adapter-react.
 *
 * The wallet is injected AFTER hydration (via setTimeout) to avoid React
 * hydration mismatches. The adapter's polling strategy detects the wallet
 * once it appears on `window.phantom.solana`, then autoConnect triggers.
 *
 * Must be called BEFORE page.goto().
 */
export async function injectMockWallet(page: Page, pubkey = MOCK_PUBKEY) {
  await page.addInitScript(
    ({ pk }) => {
      // Store wallet name so autoConnect picks it up.
      // wallet-adapter-react uses JSON.parse, so we store JSON-encoded.
      localStorage.setItem("walletName", JSON.stringify("Phantom"));

      // Defer phantom injection to AFTER React hydration completes.
      // This prevents server/client tree mismatches (hydration errors).
      // The PhantomWalletAdapter's scopePollingDetectionStrategy will
      // detect window.phantom.solana once it appears.
      setTimeout(() => {
        const pubkeyObj = {
          toBase58: () => pk,
          toBytes: () => new Uint8Array(32),
          toString: () => pk,
          equals: () => false,
        };

        Object.defineProperty(window, "phantom", {
          value: {
            solana: {
              isPhantom: true,
              publicKey: pubkeyObj,
              isConnected: true,
              connect: async () => ({ publicKey: pubkeyObj }),
              disconnect: async () => {},
              signMessage: async () => ({ signature: new Uint8Array(64) }),
              signTransaction: async (tx: any) => tx,
              signAllTransactions: async (txs: any[]) => txs,
              on: () => {},
              off: () => {},
              removeListener: () => {},
              removeAllListeners: () => {},
              emit: () => {},
            },
          },
          writable: false,
          configurable: true,
        });

        Object.defineProperty(window, "solana", {
          get() {
            return (window as any).phantom?.solana;
          },
          configurable: true,
        });
      }, 100);
    },
    { pk: pubkey },
  );
}
