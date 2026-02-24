import { test as base, type Page } from "@playwright/test";
import {
  DEMO_WALLET,
  MOCK_COURSES,
  MOCK_ENROLLMENT,
  MOCK_ENROLLMENT_FLAGS,
  MOCK_XP_BALANCE,
  MOCK_LEADERBOARD,
  MOCK_CREDENTIALS,
  generateStreakData,
} from "./mock-data";

type DemoFixtures = {
  demoPage: Page;
};

export const test = base.extend<DemoFixtures>({
  demoPage: async ({ page }, use) => {
    // Block analytics
    await page.route("**/google-analytics.com/**", (route) => route.abort());
    await page.route("**/posthog.com/**", (route) => route.abort());
    await page.route("**/sentry.io/**", (route) => route.abort());
    await page.route("**/ingest.sentry.io/**", (route) => route.abort());

    // Mock API routes
    await page.route("**/api/leaderboard*", (route) =>
      route.fulfill({ json: MOCK_LEADERBOARD })
    );
    await page.route("**/api/complete-lesson", (route) =>
      route.fulfill({ json: { signature: "DemoTx1111111111111111" } })
    );
    await page.route("**/api/finalize-course", (route) =>
      route.fulfill({ json: { signature: "DemoTx2222222222222222" } })
    );
    await page.route("**/api/issue-credential", (route) =>
      route.fulfill({ json: { signature: "DemoTx3333333333333333" } })
    );

    // Mock Sanity CDN — lesson content
    await page.route("**/cdn.sanity.io/**", (route) =>
      route.fulfill({
        json: {
          result: [
            {
              _id: "lesson-1",
              title: "Introduction to Solana",
              body: [
                {
                  _type: "block",
                  children: [
                    {
                      _type: "span",
                      text: "Solana is a high-performance blockchain supporting thousands of transactions per second.",
                    },
                  ],
                },
              ],
            },
          ],
        },
      })
    );

    // Mock RPC calls
    const rpcHandler = (method: string) => {
      switch (method) {
        case "getTokenAccountBalance":
          return {
            value: {
              amount: String(MOCK_XP_BALANCE),
              decimals: 0,
              uiAmount: MOCK_XP_BALANCE,
              uiAmountString: String(MOCK_XP_BALANCE),
            },
          };
        case "getAssetsByOwner":
          return { items: MOCK_CREDENTIALS, total: MOCK_CREDENTIALS.length };
        case "getAccountInfo":
          return { value: null };
        case "getProgramAccounts":
          return [];
        case "getBalance":
          return { value: 5_000_000_000 };
        case "getLatestBlockhash":
          return {
            value: {
              blockhash: "Demo1111111111111111111111111111111111111111111",
              lastValidBlockHeight: 999999,
            },
          };
        case "getSlot":
          return 300000000;
        case "getEpochInfo":
          return { epoch: 600, slotIndex: 100, slotsInEpoch: 432000 };
        default:
          return null;
      }
    };

    await page.route("**/api.devnet.solana.com", async (route) => {
      const body = route.request().postDataJSON();
      if (!body) return route.fulfill({ json: { jsonrpc: "2.0", id: 1, result: null } });

      if (Array.isArray(body)) {
        const results = body.map((req: { method: string; id: number }) => ({
          jsonrpc: "2.0",
          id: req.id,
          result: rpcHandler(req.method),
        }));
        return route.fulfill({ json: results });
      }

      return route.fulfill({
        json: { jsonrpc: "2.0", id: body.id, result: rpcHandler(body.method) },
      });
    });

    await page.route("**/devnet.helius-rpc.com/**", async (route) => {
      const body = route.request().postDataJSON();
      if (!body) return route.fulfill({ json: { jsonrpc: "2.0", id: 1, result: null } });
      return route.fulfill({
        json: { jsonrpc: "2.0", id: body.id, result: rpcHandler(body.method) },
      });
    });

    // WebSocket subscriptions — intercept not needed, RPC mock handles it

    // Pre-seed localStorage
    const streakData = generateStreakData();
    await page.addInitScript(
      ({ wallet, streak }) => {
        localStorage.setItem("superteam-onboarding-seen", "1");
        localStorage.setItem("theme", "dark");
        localStorage.setItem("locale", "en");
        localStorage.setItem(
          `streak-${wallet}`,
          JSON.stringify({
            currentStreak: 14,
            longestStreak: 21,
            freezeTokens: 2,
            lastActiveDate: new Date().toISOString().split("T")[0],
            history: streak,
          })
        );
      },
      { wallet: DEMO_WALLET, streak: streakData }
    );

    await use(page);
  },
});

export async function seedQueryCache(page: Page) {
  await page.waitForFunction(() => (window as DemoWindow).__demoQueryClient, null, {
    timeout: 10_000,
  });

  await page.evaluate(
    ({ courses, enrollment, enrollmentFlags, xp, leaderboard, credentials, wallet }) => {
      const win = window as DemoWindow;
      const qc = win.__demoQueryClient!;
      const BN = win.__BN;

      qc.setQueryData(["courses"], courses);

      for (const course of courses) {
        qc.setQueryData(["course", course.courseId], course);

        if (course.courseId === "solana-101") {
          const enrollData = {
            ...enrollment,
            lessonFlags: BN
              ? enrollmentFlags.map((f: number) => new BN(f))
              : enrollmentFlags,
          };
          qc.setQueryData(["enrollment", course.courseId, wallet], enrollData);
        }
      }

      qc.setQueryData(["xpBalance", wallet], xp);
      qc.setQueryData(["leaderboard"], leaderboard);
      qc.setQueryData(["credentials", wallet], credentials);
    },
    {
      courses: MOCK_COURSES,
      enrollment: MOCK_ENROLLMENT,
      enrollmentFlags: MOCK_ENROLLMENT_FLAGS,
      xp: MOCK_XP_BALANCE,
      leaderboard: MOCK_LEADERBOARD,
      credentials: MOCK_CREDENTIALS,
      wallet: DEMO_WALLET,
    }
  );
}

// Type augmentation for window globals exposed in demo mode
interface DemoWindow extends Window {
  __demoQueryClient?: {
    setQueryData: (key: unknown[], data: unknown) => void;
  };
  __BN?: new (val: number) => unknown;
}
