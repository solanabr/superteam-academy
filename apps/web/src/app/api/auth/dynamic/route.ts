import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { env } from "@/lib/env";
import { getDynamicEnvironmentId } from "@/lib/dynamic/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { isAccountDeleted } from "@/lib/auth/account-status";
import { generateWalletName } from "@/lib/utils/generate-wallet-name";
import { retryPendingOnchainActions } from "@/lib/solana/onchain-queue";
import { logError, logEvent } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import type { Database } from "@/lib/supabase/types";

/**
 * Social sign-in through Dynamic → the learner's EXISTING Supabase account.
 *
 * Dynamic owns the Google/GitHub handshake; Supabase stays the account
 * identity. Without this route a learner who has always signed in with Google
 * directly, and then signs in with Google *through Dynamic*, arrives as a
 * brand-new wallet-shaped account — their XP, enrolments and credentials all
 * stranded on the old row. Prod carries 108 google and 8 github identities, so
 * forking them is the failure this route exists to prevent.
 *
 * The bridge is one claim: an OAuth identity the provider itself verified —
 * matched first by the provider's stable SUBJECT id against auth.identities
 * (#1055, which is what signs a wallet-first synthetic-email account back in
 * through its linked Google), then by verified email. Everything below is
 * about making sure that claim is genuinely Dynamic's, is genuinely for OUR
 * Dynamic environment, and is genuinely provider-verified rather than
 * self-asserted.
 *
 * Sibling of `/api/auth/wallet`, and deliberately built on the same
 * session-minting mechanism (admin `generateLink` → cookie-bound `verifyOtp`)
 * so both ways in converge on one account model.
 */

/**
 * Dynamic's per-environment JWKS endpoint.
 *
 * Sources of truth, in order of authority:
 *
 * - Dynamic's docs (https://www.dynamic.xyz/docs/overview/authentication/tokens)
 *   give the template `.../api/v0/sdk/{environmentId}/.well-known/jwks` and
 *   state the tokens are signed RS256.
 * - The installed SDK pins the same API base in
 *   `@dynamic-labs-sdk/client/dist/client/consts.d.ts`:
 *   `DEFAULT_API_BASE_URL = "https://app.dynamicauth.com/api/v0"`.
 * - Live check: `app.dynamic.xyz` and `app.dynamicauth.com` return a
 *   byte-identical key set for the same environment id, so they are one service
 *   under two names. There is no `.json` suffix on the canonical form (both
 *   `jwks` and `jwks.json` resolve; `jwks` is the documented one).
 *
 * The environment id is the tenant. A JWKS URL for someone else's environment
 * serves someone else's keys, which is why this is built from OUR configured id
 * and never from anything in the request.
 */
function jwksUrl(environmentId: string): URL {
  return new URL(
    `https://app.dynamic.xyz/api/v0/sdk/${encodeURIComponent(
      environmentId
    )}/.well-known/jwks`
  );
}

/**
 * Accepted `iss` values — the primary tenant binding.
 *
 * Dynamic stamps `iss` as `<host>/<environmentId>`, not a bare host (docs
 * example: `"app.dynamicauth.com/fb6dd9d1-09f5-43c3-8a8c-eab6e44c37f9"`). The
 * environment-id suffix is the part that carries the security: it is what makes
 * a token minted for somebody else's Dynamic project fail here even if it were
 * signed by a key we could be talked into fetching.
 *
 * Both hostnames are accepted because Dynamic uses both for the same service —
 * the docs render one, the SDK pins the other, and they serve identical keys.
 * Pinning a single spelling would be a coin flip whose losing side is a total
 * outage of this route. Accepting both widens nothing: each is still bound to
 * OUR environment id.
 */
function acceptedIssuers(environmentId: string): string[] {
  return [
    `app.dynamicauth.com/${environmentId}`,
    `app.dynamic.xyz/${environmentId}`,
  ];
}

/**
 * RS256 family only.
 *
 * The allowlist is the mitigation for the classic JWT confusion attacks: `none`
 * (no signature at all) and HS* (the verifier is talked into treating a PUBLIC
 * key from the JWKS as an HMAC secret, which an attacker also has). jose checks
 * this allowlist BEFORE it calls the key resolver, so a rejected algorithm
 * never even reaches Dynamic's JWKS.
 */
const ALLOWED_ALGORITHMS = ["RS256", "RS384", "RS512"] as const;

/**
 * OAuth providers whose email we will match an account on.
 *
 * Restricted to the two that actually exist in prod. Widening this set means
 * accepting a new provider's word on email ownership, which is a trust decision
 * per provider, not a config toggle.
 *
 * Values are Dynamic's own `ProviderEnum` literals (`@dynamic-labs/sdk-api-core`
 * `src/models/ProviderEnum.d.ts`: `Github = "github"`, `Google = "google"`).
 */
const ALLOWED_OAUTH_PROVIDERS = new Set(["google", "github"]);

/**
 * Scope that means "this learner finished authenticating".
 *
 * A valid signature is NOT enough on its own. Dynamic mints properly-signed
 * tokens for intermediate auth states too — a session still owing an additional
 * factor gets a token that passes signature, issuer, expiry and environment
 * checks alike, and is distinguishable only by a narrower `scope`. Dynamic's
 * server-side guidance is explicit that the scope list must be checked for
 * `user:basic`.
 *
 * `scope` is schema-optional, so absent means denied.
 */
const REQUIRED_SCOPE = "user:basic";

/**
 * The subset of Dynamic's `verified_credentials` entries this route reads.
 *
 * Field names are the WIRE names, taken from the SDK's own JWT model
 * (`@dynamic-labs/sdk-api-core` `src/models/JwtVerifiedCredential.js`, the
 * `JwtVerifiedCredentialFromJSON` mapping). They are not uniformly snake_case:
 * `oauth_provider` is, `signInEnabled` is not. Reading the mapping rather than
 * assuming a convention is the whole point.
 */
interface DynamicVerifiedCredential {
  id?: unknown;
  format?: unknown;
  email?: unknown;
  oauth_provider?: unknown;
  oauth_account_id?: unknown;
  oauth_emails?: unknown;
  oauth_account_photos?: unknown;
  signInEnabled?: unknown;
}

/**
 * The claims this route reads, over and above the registered ones jose checks.
 *
 * `environment_id` and `verified_credentials` are required members of Dynamic's
 * JWT model (`@dynamic-labs/sdk-api-core` `src/models/DynamicJwt.d.ts`);
 * `scope` and `signin_credential_id` are optional there, and are treated as
 * optional here.
 *
 * Every field is `unknown`, including the ones the schema marks required,
 * because Dynamic issues TWO token shapes and only one of them is this one: the
 * minified ACCESS token (`MinifiedDynamicJwt`) carries no `verified_credentials`
 * at all. A client that sends the wrong one must land in a deny branch, not in a
 * branch that reads an absent array as "no credentials, carry on".
 */
interface DynamicJwtClaims extends JWTPayload {
  environment_id?: unknown;
  verified_credentials?: unknown;
  signin_credential_id?: unknown;
  scope?: unknown;
}

/**
 * One remote key set per environment, kept across requests.
 *
 * `createRemoteJWKSet` owns the key cache, the refetch cooldown and key
 * rotation. Building a new one per request would throw all of that away and hit
 * Dynamic's JWKS on every single sign-in.
 */
let jwksCache: {
  environmentId: string;
  resolve: ReturnType<typeof createRemoteJWKSet>;
} | null = null;

function getJwks(environmentId: string): ReturnType<typeof createRemoteJWKSet> {
  if (jwksCache?.environmentId !== environmentId) {
    jwksCache = {
      environmentId,
      resolve: createRemoteJWKSet(jwksUrl(environmentId)),
    };
  }
  return jwksCache.resolve;
}

/**
 * Trim + lowercase, and nothing else.
 *
 * Deliberately NOT clever: no gmail dot-stripping, no `+tag` removal, no
 * unicode folding. Every one of those transforms maps several distinct
 * addresses onto one key, and this key decides which account a caller lands in
 * — a collision here is an account takeover. Case folding is safe because the
 * local part is case-insensitive in practice and Supabase stores emails
 * lowercased, so it is the transform that makes matching WORK rather than one
 * that makes it looser.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * The credential's email, if this credential is one we are willing to match an
 * account on. `null` otherwise.
 *
 * Four conditions, each load-bearing:
 *
 * - `format === "oauth"` — the credential was established by an OAuth
 *   handshake. Dynamic's other formats (`email`, `phoneNumber`, `passkey`,
 *   `blockchain`, `externalUser`, `totp`) prove control of something else, or
 *   in the `email` case prove only that an OTP reached an inbox.
 * - the provider is one we trust for email ownership.
 * - `signInEnabled !== false` — Dynamic's own flag for "this credential can be
 *   used to sign in". A credential Dynamic says cannot authenticate must not
 *   resolve an account either. Absent is treated as allowed, since the field is
 *   only meaningful when Dynamic actually sets it.
 * - a non-empty `email` string.
 *
 * The email is taken from the credential's own `email` field when present. In
 * practice Dynamic's LIVE google credential carries no `email` at all (the SDK
 * model says it can; a real token from this environment says it doesn't) — the
 * address arrives only in `oauth_emails` and `oauth_username`. So, for GOOGLE
 * ONLY, a single-element `oauth_emails` is accepted as a fallback: Google's
 * OAuth surface exposes exactly the account's verified primary address and
 * nothing else, which is what makes that list trustworthy there.
 *
 * The same fallback is deliberately NOT extended to GitHub. GitHub's email
 * list can include addresses the user added but never verified, so an attacker
 * could add a victim's address to their own GitHub account and have this route
 * hand them the victim's Superteam account. A github credential must carry the
 * `email` field itself; extending the fallback to a new provider is a per-
 * provider trust decision, not a refactor.
 *
 * Alongside the email, the credential's `oauth_account_id` — the provider's
 * own stable account id (Google's numeric subject) — is surfaced for the
 * subject rung. It is optional in the SDK model, so non-string/empty is
 * treated as absent, which merely skips the subject rung for that credential.
 */
interface MatchableCredential {
  email: string;
  provider: string;
  /** Provider-stable account id (`oauth_account_id`), when the token carries one. */
  subject: string | null;
  /**
   * The provider's profile photo (`oauth_account_photos[0]`), https-only —
   * this lands in an <img src>, so anything else is dropped at the boundary.
   */
  photo: string | null;
}

function matchableCredential(credential: unknown): MatchableCredential | null {
  if (!isRecord(credential)) return null;
  const {
    format,
    oauth_provider,
    oauth_account_id,
    oauth_account_photos,
    signInEnabled,
    email,
    oauth_emails,
  } = credential as DynamicVerifiedCredential;

  if (format !== "oauth") return null;
  if (typeof oauth_provider !== "string") return null;
  if (!ALLOWED_OAUTH_PROVIDERS.has(oauth_provider)) return null;
  if (signInEnabled === false) return null;

  let candidate: string | null = typeof email === "string" ? email : null;
  if (
    candidate === null &&
    oauth_provider === "google" &&
    Array.isArray(oauth_emails) &&
    oauth_emails.length === 1 &&
    typeof oauth_emails[0] === "string"
  ) {
    candidate = oauth_emails[0];
  }
  if (candidate === null) return null;

  const normalized = normalizeEmail(candidate);
  if (normalized === "") return null;

  const subject =
    typeof oauth_account_id === "string" && oauth_account_id.trim() !== ""
      ? oauth_account_id.trim()
      : null;

  const firstPhoto = Array.isArray(oauth_account_photos)
    ? oauth_account_photos[0]
    : null;
  const photo =
    typeof firstPhoto === "string" && firstPhoto.startsWith("https://")
      ? firstPhoto
      : null;

  return { email: normalized, provider: oauth_provider, subject, photo };
}

type EmailResolution =
  | {
      ok: true;
      email: string;
      /** (provider, subject) pairs of the credential(s) that won resolution. */
      subjects: ReadonlyArray<{ provider: string; subject: string }>;
      /** The winning credential's profile photo, when it carries one. */
      photo: string | null;
    }
  | { ok: false; error: "noVerifiedOauthEmail" | "ambiguousVerifiedEmail" };

/**
 * The one provider-verified email this token entitles the caller to.
 *
 * When Dynamic tells us which credential established THIS session
 * (`signin_credential_id`), that credential decides — and it has to be one of
 * the matchable ones. That is what keeps an email-OTP sign-in from silently
 * inheriting the account matched by a Google credential that merely happens to
 * be linked to the same Dynamic user.
 *
 * Without that claim we fall back to the linked credentials, but only if they
 * agree. Picking the first of several disagreeing addresses would let an
 * attacker steer which account they land in just by linking another provider.
 */
function resolveVerifiedEmail(claims: DynamicJwtClaims): EmailResolution {
  const credentials = Array.isArray(claims.verified_credentials)
    ? claims.verified_credentials
    : [];

  const signinId = claims.signin_credential_id;
  if (typeof signinId === "string" && signinId !== "") {
    const signin = credentials.find(
      (credential) => isRecord(credential) && credential.id === signinId
    );
    const matched = matchableCredential(signin);
    return matched
      ? {
          ok: true,
          email: matched.email,
          subjects: matched.subject
            ? [{ provider: matched.provider, subject: matched.subject }]
            : [],
          photo: matched.photo,
        }
      : { ok: false, error: "noVerifiedOauthEmail" };
  }

  const matched = credentials
    .map(matchableCredential)
    .filter(
      (credential): credential is MatchableCredential => credential !== null
    );
  const emails = new Set(matched.map((credential) => credential.email));

  if (emails.size === 0) return { ok: false, error: "noVerifiedOauthEmail" };
  if (emails.size > 1) return { ok: false, error: "ambiguousVerifiedEmail" };
  return {
    ok: true,
    email: [...emails][0]!,
    subjects: matched.flatMap((credential) =>
      credential.subject
        ? [{ provider: credential.provider, subject: credential.subject }]
        : []
    ),
    photo:
      matched.find((credential) => credential.photo !== null)?.photo ?? null,
  };
}

/**
 * Subject rung (#1055): map the winning credential(s) to a Supabase user by
 * OAUTH SUBJECT — `auth.identities (provider, provider_id)` via a
 * service-role-only SECURITY DEFINER lookup. This is what lets a wallet-first
 * account (synthetic email, undeliverable) be recovered through its
 * deliberately-linked Google: the identity row matches even though no email
 * ever could.
 *
 * `auth.identities` is the truth here on purpose — `profiles.google_id` /
 * `github_id` are client-written under RLS and must never resolve accounts.
 *
 * Fail modes are asymmetric by design:
 * - Two credentials resolving DIFFERENT users is a conflict the caller must
 *   refuse (403) — picking either one hands out somebody's account.
 * - Any RPC error (including function-missing where the migration has not
 *   landed) degrades the WHOLE rung to "none": the caller falls through to
 *   the email rung exactly as pre-#1055, which can never mint for an account
 *   the email match would not already have minted for. Degrading only the
 *   erroring credential could mask a conflict, so the rung is all-or-nothing.
 */
type SubjectResolution =
  | { status: "match"; userId: string }
  | { status: "none" }
  | { status: "conflict" };

async function resolveUserByOauthSubject(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  subjects: ReadonlyArray<{ provider: string; subject: string }>
): Promise<SubjectResolution> {
  const userIds = new Set<string>();
  for (const { provider, subject } of subjects) {
    const { data, error } = await supabaseAdmin.rpc(
      "find_user_by_oauth_identity",
      { p_provider: provider, p_subject: subject }
    );
    if (error) {
      logEvent({
        event: "dynamic-auth.subject-lookup-degraded",
        context: { provider, message: error.message },
      });
      return { status: "none" };
    }
    if (typeof data === "string" && data !== "") userIds.add(data);
  }
  if (userIds.size > 1) return { status: "conflict" };
  const userId = [...userIds][0];
  return userId ? { status: "match", userId } : { status: "none" };
}

/**
 * Dynamic's JWT carries the whole `verified_credentials` array, so it is
 * materially larger than the SIWS body `/api/auth/wallet` caps at 10KB — a
 * learner with several linked wallets and socials runs to a few KB of JWT
 * alone. Still bounded, just bounded somewhere a legitimate token fits.
 */
const MAX_BODY_BYTES = 16_000;

/**
 * Wallet addresses the JWT proves this Dynamic user controls.
 *
 * `blockchain` credentials are Dynamic-attested wallets: per Dynamic's auth
 * model a wallet only becomes a verified credential after the user SIGNS a
 * message proving ownership (connect-without-signing makes a "visitor", who
 * gets no JWT at all). Their `address` is the ownership proof the
 * account-fork auto-merge below rests on — the JWT is signed by Dynamic for
 * THIS user, so a wallet listed here is theirs in a way an email match could
 * never establish.
 *
 * Same per-credential respect as `matchableEmail`: a credential Dynamic says
 * cannot sign in must not merge an account either. The chain guard skips
 * KNOWN-foreign chains (the SDK's ChainEnum stamps Solana as "SOL"; "solana"
 * accepted in case the wire form differs) but tolerates an ABSENT chain — the
 * field is schema-optional, and refusing on absence would silently dead the
 * whole feature on a wire-shape surprise; address equality against
 * `profiles.wallet_address` still gates. Capped because the array is
 * attacker-adjacent input even after signature verification.
 */
function blockchainAddresses(claims: DynamicJwtClaims): string[] {
  const credentials = Array.isArray(claims.verified_credentials)
    ? claims.verified_credentials
    : [];
  const addresses = new Set<string>();
  for (const credential of credentials) {
    if (!isRecord(credential)) continue;
    if (credential.format !== "blockchain") continue;
    if (credential.signInEnabled === false) continue;
    const chain =
      typeof credential.chain === "string"
        ? credential.chain.toLowerCase()
        : null;
    if (chain !== null && chain !== "sol" && chain !== "solana") continue;
    const address = credential.address;
    if (typeof address === "string" && address.trim() !== "") {
      addresses.add(address.trim());
    }
  }
  return [...addresses].slice(0, 10);
}

/**
 * Heal the mixed-method account fork (AUTH-FLOWS.md §7): if this JWT proves
 * the caller owns a wallet that keys a wallet-shaped SHELL account (synthetic
 * `@wallet.superteam-lms.local` email, no OAuth identities), fold that shell —
 * wallet, XP, enrollments, everything — into the account they just signed
 * into. The `blockchain` credential is the proof; an email match alone never
 * merges anything.
 *
 * Fail-open by design: any doubt (ambiguity, lookup error, RPC refusal) skips
 * the merge and the sign-in proceeds unmerged — the fork is an annoyance, a
 * wrong merge is an account takeover. The RPC re-validates shell-ness in SQL
 * and runs the whole move in one transaction, so a half-merged state cannot
 * exist.
 */
async function mergeWalletShellAccount(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  userId: string,
  claims: DynamicJwtClaims
): Promise<void> {
  try {
    const wallets = blockchainAddresses(claims);
    if (wallets.length === 0) return;

    const { data: shells, error: shellError } = await supabaseAdmin
      .from("profiles")
      .select("id, wallet_address")
      .in("wallet_address", wallets)
      .neq("id", userId)
      .is("deleted_at", null);
    if (shellError || !shells || shells.length === 0) return;
    if (shells.length > 1) {
      logEvent({
        event: "dynamic-auth.shell-merge-ambiguous",
        context: { userId, candidates: shells.length },
      });
      return;
    }
    const shell = shells[0]!;
    if (!shell.wallet_address) return;

    // Shell-ness, auth side: the synthetic email says the account was born
    // from a wallet; the identities check says it never became anything more.
    // An account with a real OAuth identity is somebody's account, not a
    // shell — never merge it, whatever its email looks like. The RPC
    // re-proves the profile side (google_id/github_id NULL, email pattern).
    const { data: shellUser, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(shell.id);
    if (userError || !shellUser?.user) return;
    const shellEmail = shellUser.user.email ?? "";
    if (!shellEmail.endsWith("@wallet.superteam-lms.local")) return;
    // A real shell has exactly its synthetic email identity (from
    // admin.createUser). Any non-email identity means it is somebody's
    // account; NO identities means we don't know what it is — refuse both.
    const identities = shellUser.user.identities ?? [];
    if (identities.length === 0) return;
    if (identities.some((identity) => identity.provider !== "email")) return;

    const { data: merged, error: mergeError } = await supabaseAdmin.rpc(
      "merge_wallet_shell_account",
      { p_target: userId, p_shell: shell.id, p_wallet: shell.wallet_address }
    );
    if (mergeError) {
      logError({
        errorId: ERROR_IDS.DYNAMIC_AUTH_FAILED,
        error: new Error(mergeError.message),
        context: { note: "shell merge refused", userId, shellId: shell.id },
      });
      return;
    }
    logEvent({ event: "dynamic-auth.shell-merged", context: { merged } });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.DYNAMIC_AUTH_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { note: "shell merge failed", userId },
    });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // The environment id is the tenant binding for everything below, so an
    // unconfigured deployment fails closed: there is no safe default, only a
    // JWKS URL for nobody's environment.
    //
    // Lowercased once, here, so the JWKS URL, the `iss` match and the
    // `environment_id` check can never disagree with each other. Dynamic
    // environment ids are UUIDs and it stamps them lowercase; hex case carries
    // no meaning, so this cannot weaken a comparison, and it removes the footgun
    // where a differently-cased paste into the Vercel dashboard 401s everyone.
    const environmentId = getDynamicEnvironmentId()?.toLowerCase();
    if (!environmentId) {
      logEvent({
        event: "dynamic-auth.not-configured",
        context: { note: "NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID is unset" },
      });
      return NextResponse.json(
        { error: "dynamicNotConfigured" },
        { status: 503 }
      );
    }

    // Per-IP, because the per-account key cannot exist yet — this route runs
    // before any account is resolved, and the whole point of it is that it may
    // create one.
    const ip = getClientIp(request.headers);
    if (
      await isRateLimited("dynamic-auth", ip, {
        maxTokens: 10,
        refillIntervalMs: 60_000,
      })
    ) {
      return NextResponse.json({ error: "rateLimited" }, { status: 429 });
    }

    const bodyText = await request.text();
    if (bodyText.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "requestTooLarge" }, { status: 413 });
    }

    let dynamicJwt: unknown;
    try {
      const body: unknown = JSON.parse(bodyText);
      dynamicJwt = isRecord(body) ? body.dynamicJwt : undefined;
    } catch {
      return NextResponse.json({ error: "invalidRequest" }, { status: 400 });
    }
    if (typeof dynamicJwt !== "string" || dynamicJwt === "") {
      return NextResponse.json({ error: "invalidRequest" }, { status: 400 });
    }

    let claims: DynamicJwtClaims;
    try {
      const verified = await jwtVerify<DynamicJwtClaims>(
        dynamicJwt,
        getJwks(environmentId),
        {
          algorithms: [...ALLOWED_ALGORITHMS],
          issuer: acceptedIssuers(environmentId),
          // `exp` is not required by the JWS spec and jose only enforces the
          // ones that are present, so a token minted without one would verify
          // forever. Requiring it makes expiry non-optional; `sub` and
          // `environment_id` are required so the checks below cannot be
          // sidestepped by simply omitting a claim.
          requiredClaims: ["exp", "iat", "sub", "environment_id"],
        }
      );
      claims = verified.payload;
    } catch {
      // No detail, and never the token: the caller learns only that it did not
      // verify. Which of signature / expiry / issuer / algorithm failed is an
      // oracle we have no reason to hand out.
      return NextResponse.json({ error: "invalidToken" }, { status: 401 });
    }

    // Tenant check, corroborating the `iss` suffix jose already enforced. It is
    // here because it is cheap and because it survives Dynamic reformatting
    // `iss`: if that ever happens this route should keep rejecting foreign
    // tokens rather than quietly start accepting them.
    //
    // `aud` is deliberately NOT part of this. Dynamic documents it as the
    // "client origin" (`@dynamic-labs/sdk-api-core` `src/models/DynamicJwt.d.ts`,
    // and the docs example is a dashboard URL), so it varies per origin —
    // localhost, every Vercel preview URL, prod. Pinning it would break deploys
    // while proving nothing about the tenant.
    if (
      typeof claims.environment_id !== "string" ||
      claims.environment_id.toLowerCase() !== environmentId
    ) {
      logEvent({
        event: "dynamic-auth.foreign-environment",
        context: { sub: claims.sub },
      });
      return NextResponse.json({ error: "invalidToken" }, { status: 401 });
    }

    // Whitespace-separated, per RFC 8693 and Dynamic's own description of the
    // claim. Denies a mid-flow token that is otherwise perfectly valid.
    const scopes =
      typeof claims.scope === "string" ? claims.scope.split(/\s+/) : [];
    if (!scopes.includes(REQUIRED_SCOPE)) {
      logEvent({
        event: "dynamic-auth.incomplete-auth",
        context: { sub: claims.sub },
      });
      return NextResponse.json({ error: "incompleteAuth" }, { status: 401 });
    }

    const resolved = resolveVerifiedEmail(claims);
    if (!resolved.ok) {
      logEvent({
        event: "dynamic-auth.no-verified-email",
        context: { sub: claims.sub, reason: resolved.error },
      });
      return NextResponse.json({ error: resolved.error }, { status: 403 });
    }
    const supabaseAdmin = createAdminClient();

    // Subject before email — a deliberate settings-page link (an
    // auth.identities row) beats an email coincidence. This is the recovery
    // path for wallet-first accounts: their synthetic email can never match,
    // but the Google identity they linked resolves them here, and the session
    // is minted with THEIR email (synthetic included — generateLink is
    // per-user-email, and the wallet route mints synthetic-email sessions
    // every day). When both rungs would match different accounts, the subject
    // account wins by construction: the email rung never runs.
    let email = resolved.email;
    let subjectMatched = false;
    const subjectResolution = await resolveUserByOauthSubject(
      supabaseAdmin,
      resolved.subjects
    );
    if (subjectResolution.status === "conflict") {
      // Same fail-closed posture as ambiguousVerifiedEmail: credentials
      // pointing at different accounts must never let the caller pick one.
      logEvent({
        event: "dynamic-auth.conflicting-oauth-identity",
        context: { sub: claims.sub },
      });
      return NextResponse.json(
        { error: "conflictingOauthIdentity" },
        { status: 403 }
      );
    }
    if (subjectResolution.status === "match") {
      const { data: matchedUser, error: matchedError } =
        await supabaseAdmin.auth.admin.getUserById(subjectResolution.userId);
      if (matchedError || !matchedUser?.user?.email) {
        // The identity row named a user we cannot fetch — degrade to the
        // email rung (pre-#1055 behavior) rather than block sign-in.
        logEvent({
          event: "dynamic-auth.subject-lookup-degraded",
          context: { sub: claims.sub, step: "getUserById" },
        });
      } else {
        email = matchedUser.user.email;
        subjectMatched = true;
      }
    }

    // Create-then-link, exactly as /api/auth/wallet does, and for a stronger
    // reason here: the admin API has no lookup-by-email, only a paginated
    // `listUsers`, and paging every user on each sign-in is not viable. Supabase
    // enforces email uniqueness, so `createUser` IS the lookup — "already been
    // registered" means the account exists and `generateLink` below will resolve
    // that exact row. Any OTHER createUser failure aborts rather than falling
    // through, because falling through on an ambiguous error is how you fork the
    // account this route exists to preserve.
    //
    // A subject match skips this entirely: the account is known to exist, and
    // probing createUser with its (possibly synthetic) email buys nothing.
    if (!subjectMatched) {
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
      });

      if (
        createError &&
        !createError.message.includes("already been registered")
      ) {
        logError({
          errorId: ERROR_IDS.DYNAMIC_AUTH_FAILED,
          error: new Error(createError.message),
          context: { step: "createUser" },
        });
        return NextResponse.json({ error: "authFailed" }, { status: 500 });
      }
    }

    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (linkError || !linkData) {
      return NextResponse.json({ error: "authFailed" }, { status: 500 });
    }

    const cookieStore = await cookies();

    const supabaseAnon = createServerClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: sessionData, error: verifyError } =
      await supabaseAnon.auth.verifyOtp({
        type: "magiclink",
        token_hash: linkData.properties.hashed_token,
      });

    if (verifyError || !sessionData.session) {
      return NextResponse.json({ error: "authFailed" }, { status: 500 });
    }

    // #489, same reasoning as the wallet route: a soft-deleted account must not
    // be revivable through a second front door. Signing out through the SAME
    // cookie-bound client overwrites the session cookies verifyOtp just queued,
    // so the browser never holds a usable session for a tombstoned account.
    const userId = sessionData.session.user.id;
    if (await isAccountDeleted(userId)) {
      await supabaseAnon.auth.signOut();
      return NextResponse.json({ error: "accountDeleted" }, { status: 403 });
    }

    // Parity with the other two login chokepoints (/api/auth/wallet,
    // /api/auth/callback): a brand-new account arrives with a `user_xxxxxxxx`
    // placeholder username the DB trigger assigned, so first-time Dynamic
    // sign-ups would otherwise sit on the leaderboard as `user_…` forever.
    // Existing matched accounts already have a real name and are left alone.
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("username, wallet_address, avatar_url")
      .eq("id", userId)
      .single();

    // Account-fork auto-merge, only when this account has no wallet of its
    // own to lose — and BEFORE the queue drain below, so pending on-chain
    // actions inherited from the shell drain in this same sign-in.
    if (!profile?.wallet_address) {
      await mergeWalletShellAccount(supabaseAdmin, userId, claims);
    }

    if (profile?.username?.startsWith("user_")) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const { error: nameError } = await supabaseAdmin
          .from("profiles")
          .update({ username: generateWalletName() })
          .eq("id", userId);
        if (!nameError) break;
      }
    }

    // Adopt/refresh the provider photo, mirroring the legacy callback's rule
    // exactly: provider CDN URLs rotate, so refresh on every login — but a
    // custom Supabase-storage upload (URL carries our project host) is the
    // learner's own choice and is never overwritten. Without this, a learner
    // whose only way in is the Dynamic bridge kept the placeholder avatar
    // forever. https-only enforcement happens at the credential boundary.
    if (resolved.photo) {
      const storageHost = new URL(env.NEXT_PUBLIC_SUPABASE_URL).host;
      const storedAvatar = profile?.avatar_url ?? null;
      const isCustomUpload =
        storedAvatar !== null && storedAvatar.includes(storageHost);
      if (!isCustomUpload && storedAvatar !== resolved.photo) {
        await supabaseAdmin
          .from("profiles")
          .update({ avatar_url: resolved.photo })
          .eq("id", userId);
      }
    }

    // The on-chain retry queue drains from the login routes, so this new
    // chokepoint must drain it too — otherwise a learner who only ever signs in
    // through Dynamic never gets their queued enrollments/XP/achievements
    // retried. Fire-and-forget: a queue hiccup must not fail the sign-in.
    retryPendingOnchainActions(userId).catch((err: unknown) =>
      logError({
        errorId: ERROR_IDS.DYNAMIC_AUTH_FAILED,
        error: err instanceof Error ? err : new Error(String(err)),
        context: { note: "retryPendingOnchainActions failed", userId },
      })
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.DYNAMIC_AUTH_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/auth/dynamic" },
    });
    return NextResponse.json({ error: "internalError" }, { status: 500 });
  }
}
