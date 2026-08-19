# Auth Flows

Every way into a Supabase session, mapped from the code. Paths are relative to
`apps/web/` unless they start with `docs/` or `onchain-academy/`.

The architecture invariant:

> An external prover proves things (Dynamic for Google handshakes and embedded-wallet
> ownership, wallet-adapter for external-wallet ownership, Supabase OAuth for GitHub);
> **Supabase owns identity**; every proof is exchanged **server-side** for a Supabase
> cookie session.

The one-liner "Dynamic proves things" is true only for the Dynamic path. Two ways in
never touch Dynamic: wallet-adapter SIWS (the wallet itself signs the proof) and
Supabase OAuth (Google/GitHub when Dynamic is unconfigured — the fallback and kill
switch), where Supabase both proves and owns. The load-bearing halves hold everywhere: no client-side session
minting, and Supabase user ids are the only identity every table and RLS policy hangs
off. One soft bend: after an OAuth _link_, the settings page syncs `profiles.google_id`
/ `github_id` client-side under RLS (`src/app/[locale]/(platform)/settings/_components/account-tab.tsx`)
— profile metadata, not session material.

```
  Connect Solana Wallet    Google/GitHub (Dynamic on)  Embedded-wallet SIWS    Google/GitHub (Dynamic off)
        |                      |                          |                          |
  wallet-adapter modal   signInWithSocialRedirect   DynamicAuthHandler job 3   supabase.auth.signInWithOAuth
        |                      | (full-page nav)     (restored Dynamic session,     |
  WalletAuthHandler      DynamicAuthHandler job 0    no Supabase session)      GET /api/auth/callback
  SIWS sign → POST       completeSocialRedirect →   SIWS sign → POST          exchangeCodeForSession
  /api/auth/wallet       POST /api/auth/dynamic     /api/auth/wallet               |
        |                      | (JWT)                   |                          |
        +------------- Supabase session cookies, set server-side -----------------+
```

The three session-minting routes (`/api/auth/wallet`, `/api/auth/dynamic`,
`/api/auth/callback`) share four post-login rituals: tombstone refusal
(`src/lib/auth/account-status.ts`, `profiles.deleted_at`; fails OPEN on query error so
a Supabase blip can't lock everyone out), replacement of the `user_xxxxxxxx`
placeholder username, a fire-and-forget `retryPendingOnchainActions` drain, and — on
the two rails that carry a provider photo (`/api/auth/dynamic` and
`/api/auth/callback`, #1063) — avatar adoption: the provider avatar is written on
FIRST login only, when `profiles.avatar_url` is null (owner ruling 2026-08-19). Once
any avatar exists — provider photo or custom upload — no sign-in overwrites it. Add a
new way in, add all of them. The middleware is not another chokepoint — it mints
nothing; it re-runs the tombstone check per request as a backstop, and that is all.

## 1. Ways in — the auth modal

`src/components/auth/auth-modal.tsx`. Three buttons. The modal deliberately calls no
Dynamic hook itself: every hook in `@dynamic-labs-sdk/react-hooks` throws
`MissingProviderError` without a provider, and hooks can't be conditional, so the
feature gate is a component boundary — `DynamicSocialSignIn` (one component, a
`PROVIDERS` map per provider) owns the hooks and mounts only when
`isDynamicEnabled()` (`src/lib/dynamic/config.ts`). A fourth entry, email-OTP through
Dynamic, was removed from the modal in #1032 because it mints a wallet-shaped account
that forks from a later Google login; the component itself was deleted in #1040.

### Connect Solana Wallet (wallet-adapter SIWS)

Button hands off to the wallet-adapter modal; the actual auth is
`src/components/auth/wallet-auth-handler.tsx`, mounted at layout level, which fires on
wallet connect when no Supabase user exists:

1. `GET /api/auth/nonce` (`src/app/api/auth/nonce/route.ts`) — random nonce inserted
   into `siws_nonces` with `status='pending'`, 5-min TTL, max 10 pending per IP
   (IPv6 collapsed to /64 by `getClientIp`). Returns `{nonce, domain, expiresAt}`.
2. Prefer Wallet Standard `signIn` — the wallet builds AND signs the message and
   returns the exact bytes, which survives wallets that re-serialize SIWS messages
   (Backpack). Fall back to raw `signMessage` over a locally built message
   (`createSIWSMessage`/`formatSIWSMessage`).
3. `POST /api/auth/wallet` with `{message, signature, publicKey}` (10KB body cap —
   like the dynamic route's 16KB, a decimal UTF-16 length check after the body is
   fully read; a bound on processing, not on ingress).
4. On success: **hard redirect** to `/dashboard` — the browser Supabase client only
   reads cookies on boot, so a soft navigation leaves the header logged-out.

Server verification (`src/lib/solana/verify-siws.ts`), in order: parse fields → expiry

- issued-at age + expiration-window ≤ 5 min (the age/window checks run only when the
  message carries an `Issued At`; absent means they're skipped, `verify-siws.ts:172`) →
  nonce exists/pending/unexpired (checked
  BEFORE the signature so failed signatures don't burn nonces) → domain equals the `host`
  header → address in message equals `publicKey` → Ed25519 verify → atomically consume
  the nonce (`UPDATE … WHERE status='pending'`, so concurrent requests can't double-spend).

### Sign in with Google

Two implementations behind one button slot:

- **Dynamic configured** (`src/components/auth/dynamic-social-sign-in.tsx`): clears any
  stale Dynamic session first (a pre-existing `client.user` flips the SDK's callback
  processing from `oauthSignIn` to `oauthVerify` = link-to-wrong-user), then
  `signInWithSocialRedirect({provider: "google", redirectUrl: window.location.href})`.
  Full-page navigation — `signInWithSocialPopUp` is React-Native-only and throws on web
  (`src/lib/dynamic/social.ts`). The return leg is DynamicAuthHandler job 0 (§2), which
  ends in `POST /api/auth/dynamic` (§3). This path also leaves the learner with an
  embedded Solana wallet; the fallback does not.
- **Dynamic off**: plain `supabase.auth.signInWithOAuth({provider: "google"})` with a
  `redirectTo` built by `buildOAuthRedirect` (`src/lib/auth/oauth-redirect.ts`) so the
  learner returns to the page they left, not always `/dashboard` (#619).

### Sign in with GitHub

Mirrors Google: **Dynamic on** routes through `signInWithSocialRedirect({provider:
"github"})` and the same job-0 → `POST /api/auth/dynamic` return leg. The live GitHub
credential carries no `email` field; its single-element `oauth_emails` is accepted
ONLY when the same token holds a Dynamic-verified `email`-format credential for the
identical address (the corroboration rule — GitHub's own list can carry unverified
addresses). **Dynamic off** falls back to Supabase OAuth and returns through
`GET /api/auth/callback` (`src/app/api/auth/callback/route.ts`):
`exchangeCodeForSession(code)`, cookies set on the redirect response, `next` param
re-sanitized server-side (`sanitizeRedirect`: single leading slash, no `//`, no `\`,
no `:` — kills protocol-relative, Windows-relative, and scheme injection). Also
performs the avatar-adoption ritual (see the shared-rituals list above): adopts the
provider's `user_metadata.avatar_url` on FIRST login only — Google and GitHub alike,
despite living in this callback.

## 2. DynamicAuthHandler

`src/components/auth/dynamic-auth-handler.tsx`, mounted inside `DynamicProvider` by
`src/components/auth/dynamic-wallet-provider.tsx` (as a sibling it would crash every
page on hydration — the hooks throw outside a provider). No UI. Four jobs:

0. **Social-redirect return.** The button that started sign-in is gone after the
   full-page round trip, so something mounted on every page must finish it:
   `detectSocialRedirectUrl` → `completeSocialRedirect` → strip callback params →
   if a Supabase session already exists this was a _link_, stop (job 3 will attach the
   wallet) → otherwise `bridgeDynamicSession()` → on success **hard reload**; on
   failure toast + `logoutDynamic()`, because "authenticated to Dynamic, refused by
   Supabase" is a dead end that would re-fail on every page load.
1. **Device-registration redirect.** Optional (dashboard toggle, off by default — an
   earlier comment here wrongly claimed required). Consumes the emailed token and
   strips it from the URL so a refresh or shared link can't replay it.
2. **Embedded wallet creation.** The headless SDK does NOT create a wallet on sign-in;
   without `createWaasWalletAccounts` a learner authenticates and has nothing to enrol
   with. On failure the `creatingWallet` ref stays set — retry-per-render would hammer
   the MPC service.
3. **SIWS bridge.** Once a `chain === "SOL"` account exists (local predicate — the pnpm
   graph holds two SDK client instances, so the SDK's own type guard doesn't compose),
   `runWalletSiws` (`src/lib/wallet/siws.ts`) signs a server nonce with the embedded
   wallet and calls `/api/auth/wallet` (no session → sign in) or
   `/api/auth/link-wallet` (session → link). Success hard-reloads; any failure clears
   `handledAddress` so the learner can retry without reloading. For an already-linked
   learner the thing that prevents a re-prompt across page loads is the
   `profiles.wallet_address` early return (`dynamic-auth-handler.tsx:247-254`) —
   `handledAddress` only dedupes within a single page load.

The guards, each of which closed a live incident:

- **Module-level handshake promise** (`socialReturnOutcome`). `completeSocialRedirect`
  spends a one-time OAuth code; StrictMode's double-effect or any remount replays a
  spent code, throws, and the failure path then logs out the session the first run just
  established (observed live: 200 bridge → aborted duplicate → "not signed in"). The
  `??=` assignment runs synchronously before the first await, so only the first
  invocation runs the handshake; every other invocation awaits the SAME promise. It is
  a promise, not a boolean, because "claimed" ≠ "resolved" — a boolean would release
  job 3's guard mid-flight. `"release"` clears the guard; `"hold"` means a reload is
  imminent and the guard stays up. Module scope, not a ref: a ref dies with its fiber,
  and both outcomes end this page load's story anyway.
- **`bridgingSocial` gates jobs 2 AND 3.** Held from the very first render (state
  initialized `true`, released only when the outcome is `"release"`). Job 3 must not
  run mid-return: with no Supabase session visible yet it would take the sign-in branch
  and mint a second, wallet-shaped account — the exact fork `/api/auth/dynamic` exists
  to prevent. Job 2 must not run mid-return either: the multi-round MPC keygen would
  start exactly as job 0's success path hard-reloads, killing keygen in flight and
  leaving the learner wallet-less (observed live at the 2026-08-13 event, #1034).
  It is React state, not a ref, so releasing it re-runs jobs 2/3 for a user/wallet that
  arrived while it was held; both effects list it in deps for that reason.
- **`socialReturnPending`** (`src/lib/dynamic/social.ts`, module-level store +
  `useSyncExternalStore` via `src/hooks/use-social-return-pending.ts`): published only
  once a social return is POSITIVELY detected, consumed by the sign-in buttons as their
  loading state (#1035 — owner chose button-level loading over a full-screen overlay).
  Left set on the success path on purpose; the flag dies with the reload.
- **`handledAddress` ref**: the address can arrive twice (restored session, then a
  create event); without it the learner is asked to sign the same nonce twice.

## 3. POST /api/auth/dynamic — the verification ladder

`src/app/api/auth/dynamic/route.ts`. One claim crosses this route: _an OAuth identity
the provider itself verified_ — matched by the provider's stable subject id first,
then by email. The ladder proves the claim is genuinely Dynamic's, for OUR
environment, and provider-verified rather than self-asserted:

1. Environment id from OUR env (`getDynamicEnvironmentId()`, lowercased once) — unset =
   503, fail closed. Never taken from the request.
2. Per-IP rate limit (10/min) — per-IP because no account exists yet. Fails OPEN on
   a rate-limit-store error (same deliberate availability bias as the tombstone).
3. 16KB body cap (the full JWT carries `verified_credentials` and outgrows the wallet
   route's 10KB).
4. `jwtVerify` against Dynamic's JWKS **for our environment id**
   (`app.dynamic.xyz/api/v0/sdk/{id}/.well-known/jwks`, cached via one
   `createRemoteJWKSet` per environment). Algorithm allowlist RS256/384/512 — kills
   `alg:none` and HS\* key-confusion before the key resolver ever runs. Issuer must be
   `app.dynamicauth.com/{id}` or `app.dynamic.xyz/{id}` — the id suffix is the tenant
   binding; both hosts serve byte-identical keys. `requiredClaims: exp, iat, sub,
environment_id` — `exp` is optional in JWS, so without requiring it a token minted
   without one verifies forever. All verification failures collapse to one opaque 401.
5. `environment_id` claim equals ours (corroborates `iss`; survives Dynamic
   reformatting `iss`). `aud` is deliberately NOT pinned — it's the client origin and
   varies across localhost/preview/prod.
6. `scope` must include `user:basic`. Dynamic signs tokens for intermediate auth states
   too (e.g. MFA still owed); scope is the only thing distinguishing them.
7. `resolveVerifiedEmail`: when `signin_credential_id` is present, THAT credential
   decides — this stops an email-OTP sign-in inheriting the account matched by a merely
   linked Google credential. Otherwise all matchable credentials must agree on one
   address (`ambiguousVerifiedEmail` otherwise — first-of-several would let an attacker
   steer accounts by linking providers). A credential is matchable only if
   `format === "oauth"`, provider ∈ {google, github}, `signInEnabled !== false`, and it
   carries an email. Google-only fallback: a single-element `oauth_emails` is accepted,
   because Dynamic's live google credential carries no `email` field and Google's OAuth
   surface exposes exactly the verified primary address. NOT extended to GitHub —
   GitHub's list can contain unverified addresses, which would be an account takeover.
8. `normalizeEmail` = trim + lowercase only. No gmail dot-stripping, no `+tag` removal:
   every clever transform maps distinct addresses onto one key, and this key decides
   which account the caller lands in.
9. **Subject rung** (#1055): the winning credential(s)' `oauth_account_id` — the
   provider's stable subject — is looked up in `auth.identities (provider,
provider_id)` via `find_user_by_oauth_identity` (SECURITY DEFINER,
   service_role-only; `profiles.google_id`/`github_id` are client-written under RLS
   and never resolve accounts). Exactly one match → the session is minted with THAT
   user's own email, synthetic included — this is what signs a wallet-first account
   back in through its linked Google. Subject beats email when both would match: a
   deliberate settings-page link outranks an email coincidence. Two credentials
   matching DIFFERENT users → 403 `conflictingOauthIdentity`, fail closed. Any RPC
   error (including the migration not having landed) degrades the whole rung to the
   email rung below — pre-#1055 behavior, never a sign-in outage.
10. Email rung, create-then-link: `createUser({email, email_confirm: true})` where
    "already been registered" IS the lookup (admin API has no lookup-by-email;
    uniqueness makes createUser the probe). Any other createUser error aborts. A
    subject match skips the probe (the account is known to exist). Then
    `generateLink(magiclink)` → cookie-bound `verifyOtp(token_hash)` mints the session —
    the same mechanism as the wallet route, so both ways in converge on one account
    model.
11. Tombstone check after the session exists; sign out through the SAME cookie-bound
    client so the clearing Set-Cookie overwrites what verifyOtp just queued.
12. Post-login: placeholder-username replacement + on-chain queue drain (parity with
    the other chokepoints).

Client half (`src/lib/dynamic/social.ts`): the bridge must send **`legacyToken`** (the
full `DynamicJwt`, read via the SDK's `/core` escape hatch), not `token` — the minified
access JWT has no `verified_credentials` and is signature-valid yet 403s. Both are
`null` if the Dynamic environment is dashboard-configured for cookie auth; reported as
a normal failure.

## 4. Wallet routes

**`POST /api/auth/wallet`** (`src/app/api/auth/wallet/route.ts`) — SIWS verify (§1),
then: if a profile already holds this `wallet_address`, resolve that user's real auth
email so the magic link logs into the CORRECT account (a Google user who linked this
wallet signs in with just the wallet). Otherwise create a **wallet-shaped account**
with synthetic email `<pubkey>@wallet.superteam-lms.local`. Then
generateLink → verifyOtp, tombstone check (deletion nulls `wallet_address`, so the
deleted-reauth path always falls through to here where userId is known), and a 409
`differentWalletLinked` if the session's account already carries a different wallet —
wallet links are permanent.

**`POST /api/auth/link-wallet`** (`src/app/api/auth/link-wallet/route.ts`) — requires a
session. Same SIWS verify. Two DISTINCT 409 keys (#994 — clients need different
advice and only the server knows which happened): `walletAlreadyLinked` = this wallet
belongs to ANOTHER account; `differentWalletLinked` = THIS account already has a
different wallet. Same-wallet re-link is idempotent. On first link, one-time XP sync
mints the account's accrued Supabase XP to the wallet on-chain, guarded by
`wallet_xp_synced_at` against double-mint.

**`POST /api/auth/unlink`** (`src/app/api/auth/unlink/route.ts`) — google/github via
`supabase.auth.unlinkIdentity` + nulling `profiles.google_id`/`github_id`. Refuses when
only one method remains (`cannotUnlinkLast`). `provider: "wallet"` is always refused
(`walletLinkPermanent`): on-chain enrollments/XP/credentials are bound to that pubkey.
The wallet still counts toward the ≥2 rule, so a REAL-email account can drop Google and
end wallet-only — recoverable, because the bridge matches by email. A SYNTHETIC-email
account (`%@wallet.superteam-lms.local`) cannot drop its last OAuth identity
(`cannotUnlinkOnlyRecovery`): its email is undeliverable, so that identity is its only
path back in if wallet access is lost. Since #1055 that recovery path is real on
Dynamic-enabled deployments too: `/api/auth/dynamic`'s subject rung (§3 step 9)
resolves the account through its `auth.identities` row, synthetic email and all.

## 5. Linking after signup — Settings › Account

`src/app/[locale]/(platform)/settings/_components/account-tab.tsx`:

- **Google/GitHub**: `supabase.auth.linkIdentity({provider, options: {redirectTo:
/api/auth/callback?next=/{locale}/settings?linked=google|github}})`. On return, the
  `?linked=` effect reads the fresh identity from `auth.getUser()`, writes
  `profiles.google_id`/`github_id` (unique-violation 23505 → "already linked to
  another account"), optionally adopts the provider avatar, then strips the param via
  `history.replaceState`.
- **Wallet**: nonce → `signMessage` over a "Link this wallet…" SIWS message →
  `POST /api/auth/link-wallet`. If no wallet is connected yet, a `pendingWalletLink`
  ref opens the wallet-adapter modal and an effect completes the link once
  `publicKey`/`signMessage` appear.

## 6. Session model

- **Cookies**: every route mints the session by writing Supabase auth cookies through a
  cookie-bound `createServerClient`; the browser client is anonymous until it re-reads
  cookies on boot — hence the hard reload/redirect after every successful bridge.
- **Middleware** (`src/middleware.ts`): runs on all non-API pages, `getUser()` may
  refresh tokens (cookies copied onto request AND response), tombstone backstop on
  every request carrying a session (covers SIWS sessions that never pass the OAuth
  callback), then next-intl, then auth-gating of `/dashboard`, `/settings`, `/teach`,
  `/review`, and exact `/profile`. `/api/*` is excluded from the matcher — API routes
  do their own auth. The middleware also gates `/admin` on a separate HMAC-signed
  `admin_session` cookie; that is a parallel auth system, out of scope for this map.
- **The Dynamic session is parallel state**, not the session of record. It survives a
  Supabase sign-out, `DynamicAuthHandler` mounts everywhere, and MPC signing is
  promptless — so an orphaned Dynamic session silently re-runs the SIWS bridge and
  signs the learner straight back in on the next page load, making sign-out meaningless
  on shared devices (#1027). Therefore `handleSignOut` in
  `src/components/auth/user-menu.tsx` runs `logoutDynamic()` before
  `supabase.auth.signOut()`. `logoutDynamic` (`src/lib/dynamic/client.ts`) races
  Dynamic's `logout()` against a 2.5s deadline — a hung call must not stall sign-out;
  losing the race is fine because the redirect reloads the app.

## 7. Known seams

- **Mixed-method account fork.** An email-OTP-era Dynamic sign-in created a
  wallet-shaped account (synthetic email); the same person's Google login matches their
  real-email account — two accounts, XP split. This is why #1032 removed the email-OTP
  modal entry ("the hazard behind today's manual account merge", 2026-08-13 — one
  production account pair was merged by hand). The fork is now both prevented (no
  email-OTP entry, `bridgingSocial` guard, `/api/auth/dynamic` matching) and HEALED:
  when a Dynamic sign-in's JWT carries a `blockchain` credential matching a shell
  profile's `wallet_address`, `/api/auth/dynamic` calls
  `merge_wallet_shell_account` (one service-role transaction: wallet + per-user rows
  migrate, keep-target on unique collisions, XP summed, shell tombstoned, fail-closed
  FK sweep). The JWT credential is the ownership proof; an email match alone never
  merges. Route side is fail-open — any doubt skips the merge, sign-in proceeds.
  The remaining half of the seam — a wallet-first account whose ONLY OAuth identity
  is Google could never be signed back in through Dynamic (email rung can't reach a
  synthetic address) — closed with #1055's subject rung: the linked identity now
  resolves the account directly, and the auto-merge naturally no-ops for it (a
  subject-matched wallet-first account already has its wallet, which closes the
  merge gate).
- **Kill switch.** Unset `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` → `isDynamicEnabled()`
  false → no provider, no SDK init, no Dynamic button; the Supabase-OAuth Google button
  renders instead and `/api/auth/dynamic` 503s. SIWS with an external wallet stays the
  guaranteed way in. NEXT*PUBLIC* is build-time-inlined: flipping it needs a redeploy
  with the build cache OFF, verified by grepping served chunks (a cache-reusing
  redeploy shipping the old value caused a live incident during the Phantom removal —
  `apps/web/CLAUDE.md`).
- **Sandbox tier.** The current Dynamic environment is a sandbox (operational fact —
  dashboard-side, not encoded in this repo): ~1k MAU cap, and sandbox wallets are NOT
  migratable to a live environment. So nothing durable may be promised against a
  sandbox wallet address; the permanent-wallet-link rule and on-chain state bound to
  embedded-wallet pubkeys must be revisited before the live-environment cutover.

## 8. Why Supabase stays the trust root

Every table keys on the Supabase user id and every RLS policy is `auth.uid()`-shaped;
the SECURITY DEFINER XP/achievement functions and the admin client all assume it.
Moving the root to Dynamic means migrating every user id across 19 tables plus
on-chain linkage for no capability we lack, and puts identity behind a vendor whose
useful guarantees (JWKS, scopes) we already consume as a _prover_. The current shape
keeps Dynamic removable — unset one env var and the platform still signs everyone in —
which is exactly the property the Phantom Connect removal proved we need.
