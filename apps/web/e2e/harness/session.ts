import type { BrowserContext } from "@playwright/test";
// The harness fixtures are plain ESM so the Node servers can read them without a
// TS toolchain; fixtures.d.ts types them, and Playwright's esbuild transform
// resolves the .mjs at runtime.
import { MOCK_SUPABASE_URL, APP_BASE_URL, LEARNER } from "./fixtures.mjs";

const SUPABASE_URL = MOCK_SUPABASE_URL;
const APP_URL = APP_BASE_URL;
const LEARNER_ID = LEARNER.id;

/**
 * The cookie name the @supabase/ssr browser client reads its session from:
 * `sb-${firstUrlLabel}-auth-token`, where the label is the Supabase URL's
 * hostname up to the first dot (see supabase-js defaultStorageKey). For
 * `https://127.0.0.1:<port>` that is `sb-127-auth-token`. Derived, not
 * hard-coded, so it tracks the fixture URL.
 */
const STORAGE_KEY = `sb-${new URL(SUPABASE_URL).hostname.split(".")[0]}-auth-token`;

/**
 * Mint the cookie the browser Supabase client would have written on a real
 * sign-in. `getSession()` reads this locally (no network) and trusts the
 * embedded `expires_at`, so a non-JWT access_token with a future expiry is a
 * fully-working session for the client — no secret, no signing. The value is
 * `base64-` + base64url(JSON(session)), exactly the @supabase/ssr encoding.
 */
function buildSessionCookieValue(): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const session = {
    // The mock's /auth/v1/user matches on `Bearer <id>.fake`; keep in sync.
    access_token: `${LEARNER_ID}.fake.jwt`,
    refresh_token: "e2e-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: nowSec + 3600,
    user: {
      id: LEARNER_ID,
      aud: "authenticated",
      role: "authenticated",
      email: LEARNER.email,
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: {},
      identities: [],
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
    },
  };
  const base64url = Buffer.from(JSON.stringify(session), "utf8").toString(
    "base64url"
  );
  return `base64-${base64url}`;
}

/**
 * Attach the mocked learner session to a browser context. Call before the first
 * navigation. The cookie lives on the APP origin (that is where the browser
 * client's document.cookie storage lives), even though its name derives from the
 * Supabase host.
 */
export async function signInAsLearner(context: BrowserContext): Promise<void> {
  const appUrl = new URL(APP_URL);
  await context.addCookies([
    {
      name: STORAGE_KEY,
      value: buildSessionCookieValue(),
      domain: appUrl.hostname,
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}
