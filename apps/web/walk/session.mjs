// Sign a seeded user in against the walk stack with email and password, and
// save the session as a Playwright storage state file.
//
// The app's Supabase client (@supabase/ssr) keeps the session in a cookie on
// the app origin. The name is `sb-<first label of the Supabase host>-auth-token`
// (`sb-127-auth-token` for http://127.0.0.1:<port>) and the value is `base64-`
// plus the base64url of the session JSON, split into `.0`, `.1` cookies when it
// is long. This script lets @supabase/ssr write the cookies itself, so the
// format is always the one the app reads.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createServerClient } from "@supabase/ssr";
import {
  APP_URL,
  USERS,
  WALK_DIR,
  fail,
  readEnvFile,
  userPassword,
} from "./lib.mjs";

/** The session cookies for `role` ("learner" or "admin"), as Playwright cookies. */
export async function sessionCookies(role) {
  const user = USERS[role];
  if (!user) fail(`unknown user "${role}". Use learner or admin.`);
  const env = readEnvFile();

  const jar = new Map();
  const client = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => [...jar].map(([name, value]) => ({ name, value })),
        setAll: (cookies) => {
          for (const { name, value } of cookies) {
            if (value) jar.set(name, value);
            else jar.delete(name);
          }
        },
      },
    }
  );
  const { error } = await client.auth.signInWithPassword({
    email: user.email,
    password: userPassword(env.SUPABASE_SERVICE_ROLE_KEY, user.email),
  });
  if (error) fail(`sign-in failed for ${user.email}: ${error.message}`);
  if (jar.size === 0) fail("sign-in gave no session cookie");

  return [...jar].map(([name, value]) => ({
    name,
    value,
    domain: new URL(APP_URL).hostname,
    path: "/",
    expires: -1,
    httpOnly: false,
    secure: false,
    sameSite: "Lax",
  }));
}

/** Write `.walk/session-<role>.json` and return its path. */
export async function writeSession(role = "learner") {
  const cookies = await sessionCookies(role);
  mkdirSync(WALK_DIR, { recursive: true });
  const path = join(WALK_DIR, `session-${role}.json`);
  writeFileSync(path, JSON.stringify({ cookies, origins: [] }, null, 2), {
    mode: 0o600,
  });
  console.log(`[walk] ${role} session saved: ${path}`);
  console.log(
    `[walk] cookies on ${APP_URL}: ${cookies.map((c) => c.name).join(", ")}`
  );
  console.log(
    "[walk] use: browser.newContext({ storageState: <that path> }). The token lasts one hour."
  );
  return path;
}
