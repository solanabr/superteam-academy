import { test as base, type Page } from '@playwright/test';
import { MOCK_WALLET_ADDRESS } from './test-data';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WalletState {
  connected: boolean;
  address: string;
}

// ---------------------------------------------------------------------------
// Helpers — injected into the browser via page.addInitScript
// ---------------------------------------------------------------------------

/**
 * Simulates a connected Solana wallet by stubbing the window adapter
 * before the app hydrates. This avoids needing a real wallet extension
 * in the E2E environment.
 *
 * The mock patches `window.__MOCK_WALLET__` which pages can read,
 * and stubs `@solana/wallet-adapter-react` context via a preload script.
 */
function buildMockWalletScript(state: WalletState): string {
  return `
    window.__MOCK_WALLET__ = {
      connected: ${state.connected},
      publicKey: ${state.connected ? `"${state.address}"` : 'null'},
    };
  `;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

interface WalletFixtures {
  /** Simulate a connected wallet state before page load. */
  connectWallet: () => Promise<void>;
  /** Simulate a disconnected wallet state (default). */
  disconnectWallet: () => Promise<void>;
  /** Access the mock wallet state for assertions. */
  walletState: WalletState;
}

export const test = base.extend<WalletFixtures>({
  walletState: [
    { connected: false, address: MOCK_WALLET_ADDRESS },
    { option: true },
  ],

  connectWallet: async ({ page }, use) => {
    const connect = async () => {
      const state: WalletState = {
        connected: true,
        address: MOCK_WALLET_ADDRESS,
      };
      await page.addInitScript(buildMockWalletScript(state));
    };
    await use(connect);
  },

  disconnectWallet: async ({ page }, use) => {
    const disconnect = async () => {
      const state: WalletState = {
        connected: false,
        address: MOCK_WALLET_ADDRESS,
      };
      await page.addInitScript(buildMockWalletScript(state));
    };
    await use(disconnect);
  },
});

export { expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Page-level helpers
// ---------------------------------------------------------------------------

/**
 * Waits for the Next.js app shell to mount.
 * Useful after navigation to ensure React hydration is complete.
 */
export async function waitForAppReady(page: Page): Promise<void> {
  // Wait for the <body> to have content and Next.js hydration marker
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
}
