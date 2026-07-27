// A tiny, self-contained stand-in for the Supabase REST + Auth surface the app
// touches during the E2E. It is NOT a general Supabase emulator — it answers
// exactly the handful of requests the three specs' code paths make, with the
// exact response shapes postgrest-js / auth-js expect, and nothing else.
//
// Why it exists: the catalog's active-course set is resolved SERVER-SIDE
// (lib/content/deployments.ts reads the `public_onchain_deployments` view), so
// it cannot be mocked from the browser. A real endpoint returning a fixed
// fixture is the only way to make spec 2 deterministic under `next start`.
//
// HTTPS: env.ts requires NEXT_PUBLIC_SUPABASE_URL to be https:// in production
// (`next start` runs in production mode), so the mock must speak TLS. The cert
// is generated fresh per run by serve.mjs (no committed key). The app's Node
// process trusts it via NODE_EXTRA_CA_CERTS; the browser via ignoreHTTPSErrors.

import https from "node:https";
import { readFileSync } from "node:fs";
import { MOCK_PORT, DEPLOYMENTS, LEARNER } from "./fixtures.mjs";

const CERT = process.env.E2E_SSL_CERT;
const KEY = process.env.E2E_SSL_KEY;
if (!CERT || !KEY) {
  console.error("[mock-supabase] E2E_SSL_CERT / E2E_SSL_KEY not set");
  process.exit(1);
}

const VIEW_COLUMNS = new Set([
  "content_id",
  "kind",
  "status",
  "is_active",
  "achievement_pda",
]);

// PostgREST returns a single OBJECT when the client sets
// `Accept: application/vnd.pgrst.object+json` (`.single()`), and an ARRAY
// otherwise — including for `.maybeSingle()` on a GET, which asks for
// `application/json` and picks `data[0]` itself. Reproduce that contract exactly
// (see postgrest-js PostgrestBuilder): returning the wrong container silently
// breaks `.single()`/`.maybeSingle()` and the UI never leaves its loading state.
function wantsObject(req) {
  return (req.headers["accept"] || "").includes("pgrst.object");
}

function sendJson(res, status, body, extraHeaders = {}) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    ...cors(),
    ...extraHeaders,
  });
  res.end(payload);
}

// The app runs on a different origin (http://127.0.0.1:3100) than the mock
// (https://127.0.0.1:54329), so every browser call is cross-origin and
// supabase-js's custom headers (apikey, x-client-info, …) trigger a preflight.
function cors() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS, PATCH, DELETE",
    "access-control-allow-headers":
      "authorization, apikey, content-type, accept, accept-profile, content-profile, x-client-info, prefer, range, x-supabase-api-version",
    "access-control-expose-headers": "content-range, content-profile",
    "access-control-max-age": "86400",
  };
}

// A course row read back through the profiles/enrollments/user_progress tables.
// The learner is always enrolled in the learn-loop course and has never
// completed the target lesson, so spec 1 starts from "enrolled, not complete".
function handleRest(table, req, res) {
  switch (table) {
    case "public_onchain_deployments":
      // The catalog gate (spec 2). Always an array.
      return sendJson(
        res,
        200,
        DEPLOYMENTS.map((r) =>
          Object.fromEntries(
            Object.entries(r).filter(([k]) => VIEW_COLUMNS.has(k))
          )
        )
      );

    case "profiles": {
      // auth-provider reads this with `.single()` (object accept). Hand back a
      // profile WITH a wallet so `hasLinkedWallet` is true and the complete
      // button is enabled.
      const row = {
        username: LEARNER.username,
        avatar_url: null,
        wallet_address: LEARNER.walletAddress,
      };
      return sendJson(res, 200, wantsObject(req) ? row : [row]);
    }

    case "enrollments":
      // `.maybeSingle()` GET → array; one row makes `isEnrolled` true.
      return sendJson(res, 200, [{ id: "e2e-enrollment-1" }]);

    case "user_progress":
      // `.maybeSingle()` GET → empty array → not yet completed.
      return sendJson(res, 200, []);

    default:
      // Any other table: behave like an empty result rather than erroring, so an
      // incidental read never fails a spec on something it isn't testing.
      return sendJson(res, 200, wantsObject(req) ? null : []);
  }
}

// auth-js calls POST /auth/v1/user (getUser, server-side in middleware) with the
// session's bearer token. Return the learner for the fake token, else 401 — both
// are handled gracefully by the middleware for the public routes the specs hit.
function handleAuthUser(req, res) {
  const auth = req.headers["authorization"] || "";
  if (auth.includes(`Bearer ${LEARNER.id}.fake`)) {
    return sendJson(res, 200, {
      id: LEARNER.id,
      aud: "authenticated",
      role: "authenticated",
      email: LEARNER.email,
      app_metadata: { provider: "email" },
      user_metadata: {},
      created_at: new Date(0).toISOString(),
    });
  }
  return sendJson(res, 401, {
    code: 401,
    msg: "invalid claim: missing sub claim",
  });
}

const server = https.createServer(
  { cert: readFileSync(CERT), key: readFileSync(KEY) },
  (req, res) => {
    const { pathname } = new URL(req.url, "https://127.0.0.1");

    if (req.method === "OPTIONS") {
      res.writeHead(204, cors());
      return res.end();
    }

    if (pathname === "/health") return sendJson(res, 200, { ok: true });

    // /auth/v1/user — the only auth endpoint reached (getSession is cookie-local
    // and needs no network; the session never nears expiry so no token refresh).
    if (pathname === "/auth/v1/user") return handleAuthUser(req, res);

    // Drain and ignore any other auth POST (e.g. logout) with a clean 200 so it
    // never throws in the client.
    if (pathname.startsWith("/auth/v1/")) return sendJson(res, 200, {});

    const rest = pathname.match(/^\/rest\/v1\/([^/?]+)/);
    if (rest) return handleRest(rest[1], req, res);

    return sendJson(res, 404, { message: "not found" });
  }
);

server.listen(MOCK_PORT, "127.0.0.1", () => {
  console.log(`[mock-supabase] listening on https://127.0.0.1:${MOCK_PORT}`);
});
