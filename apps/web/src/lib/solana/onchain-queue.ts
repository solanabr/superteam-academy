import "server-only";

import { PublicKey } from "@solana/web3.js";
import { getCourseById } from "@/lib/content/queries";
import { isCourseInMaintenance } from "@/lib/content/deployments";
import { isPlatformFrozen } from "@/lib/platform/freeze";
import { checkCapstoneCredentialGate } from "@/lib/credentials/capstone-gate";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import {
  creditQuestXpRows,
  creditXpAndSettle,
  MAX_RETRIES,
} from "@/lib/gamification/xp-queue-settlement";
import {
  fetchAchievementReceipt,
  fetchEnrollment,
  fetchCourse,
} from "./academy-reads";
import {
  getConnection,
  awardAchievement,
  finalizeCourse,
  issueCredential,
  buildSignedRewardXpTx,
  sendSignedTransaction,
  TransactionNotBroadcastError,
} from "./academy-program";
import { describeTxError } from "./describe-tx-error";
import { getProgramId } from "./pda";

type OnchainActionType =
  | "achievement"
  | "certificate"
  | "course_finalize"
  | "xp"
  | "quest_xp"
  | "quest_xp_mint"
  | "enroll";

// Hard ceiling on a single quest mint, matching the REGISTERED MinterRole's
// on-chain `max_xp_per_call` (scripts/init-program.ts registers the backend
// signer with maxXpPerCall = 100, and reward_xp enforces it). That is far
// stricter than either award_xp's 2000 per-award clamp or the program's
// MAX_XP_PER_MINT of 5000, so this is the binding constraint: an amount above
// it is guaranteed to revert, which is why it defers instead of retrying.
// Raising a quest above this needs register_minter re-run with a higher cap.
const MAX_QUEST_MINT_XP = 100;

type AdminClient = ReturnType<typeof createAdminClient>;
type PendingActionRow =
  Database["public"]["Tables"]["pending_onchain_actions"]["Row"];

// ---------------------------------------------------------------------------
// 1. Generic retry wrapper
// ---------------------------------------------------------------------------

export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  // Unreachable — the loop always returns or throws on the last iteration
  throw new Error("withRetry: exhausted attempts");
}

// ---------------------------------------------------------------------------
// 2. Retry all pending on-chain actions for a user
// ---------------------------------------------------------------------------
//
// NOTE: quest_xp rows are enqueued transactionally inside get_daily_quest_state
// (atomic with the xp_granted flip), NOT via an app-side helper — a quest can
// never be marked granted without a durable pending row. Delivery is driven
// from two places: this full retry on auth, and the narrower
// retryQuestXpForUser() sweep on every /api/quests/daily GET (so a
// permanently-logged-in user who never re-auths still gets credited). See
// creditQuestXpRows() in lib/gamification/xp-queue-settlement.ts (the chain-free
// settlement module both passes share) for how delivery is made idempotent.

export async function retryPendingOnchainActions(
  userId: string
): Promise<void> {
  const adminClient = createAdminClient();
  const connection = getConnection();

  const { data: rows, error: fetchError } = await adminClient
    .from("pending_onchain_actions")
    .select("*")
    .eq("user_id", userId)
    .is("resolved_at", null)
    .lt("retry_count", MAX_RETRIES);

  if (fetchError || !rows || rows.length === 0) return;

  // ── Pass 1: DB-only quest_xp credits (no wallet required) ──
  // For a learner with a linked wallet, each credit that lands also enqueues a
  // `quest_xp_mint` row; those come back here so the mint happens on the SAME
  // sweep rather than waiting for the next login.
  const questMintRows = await creditQuestXpRows(
    adminClient,
    userId,
    rows.filter((row) => row.action_type === "quest_xp")
  );

  // ── Pass 2: on-chain actions (all require a linked wallet) ──
  const onchainRows = [
    ...rows.filter((r) => r.action_type !== "quest_xp"),
    ...questMintRows,
  ];
  if (onchainRows.length === 0) return;

  // GLOBAL deploy-window freeze (reset wave B2). When the platform is frozen,
  // DEFER every on-chain-write case in this pass — achievement, certificate,
  // course_finalize, xp, enroll — exactly like the per-course maintenance
  // deferral below: leave each row unresolved, record why, and do NOT touch
  // retry_count, so the next drain (a login after the window ends) retries them.
  // Deferring here (before the wallet fetch and any chain read) is what stops
  // the login-drainer CHURN during the window: no failed tx, no wasted RPC, no
  // retry-budget burn. quest_xp (Pass 1) is DB-only and wallet-less — it is not
  // an on-chain write, so it is intentionally NOT frozen and already ran above.
  if (await isPlatformFrozen()) {
    for (const row of onchainRows) {
      await deferForPlatformFreeze(adminClient, row);
    }
    return;
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("wallet_address")
    .eq("id", userId)
    .single();

  if (!profile?.wallet_address) return;

  const wallet = new PublicKey(profile.wallet_address);

  // onchainRows is already quest_xp-free (Pass 1 owns those) and carries the
  // mint rows Pass 1 just enqueued.
  for (const row of onchainRows) {
    try {
      const actionType = row.action_type as OnchainActionType;
      const payload = row.payload as Record<string, unknown>;

      switch (actionType) {
        case "achievement": {
          const achievementId = row.reference_id;
          let txSignature = payload.txSignature as string | undefined;
          let assetAddress = payload.assetAddress as string | undefined;

          const exists = await fetchAchievementReceipt(
            achievementId,
            profile.wallet_address,
            connection,
            getProgramId()
          );
          if (!exists) {
            const result = await withRetry(() =>
              awardAchievement(achievementId, wallet)
            );
            txSignature = result.signature;
            assetAddress = result.assetAddress.toBase58();
          }

          const { error: unlockRpcError } = await adminClient.rpc(
            "unlock_achievement",
            {
              p_user_id: userId,
              p_achievement_id: achievementId,
              p_tx_signature: txSignature,
              p_asset_address: assetAddress,
            }
          );
          if (unlockRpcError) throw new Error(unlockRpcError.message);
          break;
        }

        case "certificate": {
          const courseId = payload.courseId as string;

          // WS-2 #453 rail 3 — a close+recreate briefly removes the Course PDA
          // (see lib/admin/recreate-course.ts). A login-triggered drain must
          // not treat "in the middle of a recreate" as a transient failure:
          // bumping retry_count on every login could push a genuinely-owed
          // credential past the < 5 retry budget and abandon it forever, even
          // after the operator redeploys. DEFER instead — mirrors the
          // daily-cap deferral in creditXpAndSettle below.
          if (await isCourseInMaintenance(courseId)) {
            await deferForCourseMaintenance(adminClient, row, courseId);
            continue;
          }

          const enrollment = (await fetchEnrollment(
            courseId,
            wallet,
            connection,
            getProgramId()
          )) as Record<string, unknown> | null;

          // Already issued on-chain — just resolve the queue entry
          if (enrollment?.credential_asset) break;

          // LX-E2 — re-run the capstone gate HERE too: a `certificate` row
          // queued by the webhook (e.g. the deploy save lagged behind finalize)
          // must never be minted ungated by the drainer. `deploy_required` /
          // `indeterminate` DEFER without burning a retry (mirrors the
          // maintenance defer), so a capstone credential lands once the
          // verified deploy row appears — and never before. Runs after the
          // already-issued short-circuit above, so pre-gate holders resolve
          // cleanly (grandfathered).
          const gate = await checkCapstoneCredentialGate(
            adminClient,
            userId,
            courseId
          );
          if (
            gate.status === "deploy_required" ||
            gate.status === "indeterminate"
          ) {
            await deferForCapstoneGate(adminClient, row, courseId, gate.status);
            continue;
          }

          // Derive all fields fresh from the content bundle + on-chain (self-sufficient retry)
          const sanityCourse = await getCourseById(courseId);
          if (!sanityCourse) {
            throw new Error(
              `Course "${courseId}" not found in the content bundle`
            );
          }

          const trackCollectionAddress = sanityCourse.trackCollectionAddress as
            | string
            | undefined;
          if (!trackCollectionAddress) {
            // Since #931 getCourseById degrades a failed deployment read to a
            // null collection instead of throwing, so "no collection" no longer
            // implies "never synced" — say which, or an outage reads as an
            // operator error nobody acts on.
            throw new Error(
              sanityCourse.deploymentReadFailed
                ? `Course "${courseId}" deployment read failed — collection unknown, retrying`
                : `Course "${courseId}" has no trackCollectionAddress — sync the course first`
            );
          }

          const courseName = sanityCourse.title ?? courseId;

          let credentialName = `Superteam Academy: ${courseName}`;
          const encoder = new TextEncoder();
          while (encoder.encode(credentialName).length > 32) {
            credentialName = credentialName.slice(0, -1);
          }

          const onChainCourse = await fetchCourse(
            courseId,
            connection,
            getProgramId()
          );
          const totalXp = onChainCourse
            ? Number(onChainCourse.xp_per_lesson) *
              onChainCourse.liveLessonCount
            : 0;

          const { count: existingCerts } = await adminClient
            .from("certificates")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId);

          const metadataJson = {
            name: credentialName,
            symbol: "STACAD",
            description: `Certificate of completion for ${courseName} on Superteam Academy.`,
            image: "",
            attributes: [
              { trait_type: "Course", value: courseName },
              {
                trait_type: "Completion Date",
                value: new Date().toISOString().split("T")[0],
              },
              {
                trait_type: "Recipient",
                value: profile.wallet_address,
              },
              { trait_type: "Platform", value: "Superteam Academy" },
            ],
            properties: { category: "certificate", creators: [] },
            external_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/certificates`,
            seller_fee_basis_points: 0,
          };

          const { data: metadataRow, error: metaError } = await adminClient
            .from("nft_metadata")
            .insert({ data: metadataJson })
            .select("id")
            .single();

          if (metaError || !metadataRow) {
            throw new Error(
              metaError?.message ?? "Failed to store NFT metadata"
            );
          }

          const metadataUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/certificates/metadata?id=${metadataRow.id}`;

          let mintAddress: PublicKey;
          let mintSignature: string;
          try {
            const result = await withRetry(() =>
              issueCredential(
                courseId,
                wallet,
                credentialName,
                metadataUri,
                (existingCerts ?? 0) + 1,
                totalXp,
                new PublicKey(trackCollectionAddress)
              )
            );
            mintAddress = result.mintAddress;
            mintSignature = result.signature;
          } catch (mintErr) {
            // Clean up orphaned metadata row
            await adminClient
              .from("nft_metadata")
              .delete()
              .eq("id", metadataRow.id);
            throw mintErr;
          }

          await adminClient.from("certificates").upsert(
            {
              user_id: userId,
              course_id: courseId,
              course_title: courseName,
              mint_address: mintAddress.toBase58(),
              metadata_uri: metadataUri,
              tx_signature: mintSignature,
              credential_type: "core",
            },
            { onConflict: "user_id,course_id" }
          );
          break;
        }

        case "course_finalize": {
          const courseId =
            typeof payload.courseId === "string" ? payload.courseId : undefined;
          if (!courseId) {
            throw new Error(
              `Invalid course_finalize payload: courseId=${JSON.stringify(payload.courseId)}`
            );
          }

          // WS-2 #453 rail 3 — see the identical guard + comment on the
          // "certificate" case above.
          if (await isCourseInMaintenance(courseId)) {
            await deferForCourseMaintenance(adminClient, row, courseId);
            continue;
          }

          const reason =
            typeof payload.reason === "string"
              ? payload.reason
              : `Completed course: ${courseId}`;

          const enrollment = (await fetchEnrollment(
            courseId,
            wallet,
            connection,
            getProgramId()
          )) as Record<string, unknown> | null;

          if (!enrollment?.completed_at) {
            await withRetry(() => finalizeCourse(courseId, wallet));
          }

          // The XP bonus is optional: the current producer enqueues
          // course_finalize purely to retry the on-chain finalize (its payload
          // carries no xpAmount). Three cases, kept symmetric with the "xp"
          // case so a malformed amount can never silently resolve:
          //   • absent          → no bonus owed → resolve on the finalize.
          //   • valid, > 0      → durable-credit path (a cap-eaten bonus defers
          //                       instead of being lost — the CS-7 bug class).
          //   • present but not a positive finite number → malformed payload →
          //     throw so the shared catch bumps retry_count (never a silent
          //     resolve), exactly as the "xp" case does.
          const xpAmount = payload.xpAmount;
          if (xpAmount !== undefined) {
            if (
              typeof xpAmount !== "number" ||
              !Number.isFinite(xpAmount) ||
              xpAmount <= 0
            ) {
              throw new Error(
                `Invalid course_finalize payload: xpAmount=${JSON.stringify(xpAmount)}`
              );
            }
            await creditXpAndSettle(
              adminClient,
              userId,
              row,
              xpAmount,
              reason,
              row.reference_id,
              "course_completion" // #736
            );
            continue; // settlement (resolve / cap-defer / retry) handled inside
          }
          break; // no XP owed — resolve on the finalize
        }

        case "xp": {
          const lessonId =
            typeof payload.lessonId === "string" ? payload.lessonId : undefined;
          const xpAmount = payload.xpAmount;
          if (
            typeof xpAmount !== "number" ||
            !Number.isFinite(xpAmount) ||
            xpAmount <= 0
          ) {
            throw new Error(
              `Invalid xp payload: xpAmount=${JSON.stringify(xpAmount)}`
            );
          }
          const reason =
            typeof payload.reason === "string"
              ? payload.reason
              : `Completed lesson: ${lessonId ?? row.reference_id}`;

          // reference_id is the idempotency key — a re-sweep of an already
          // credited award is a no-op, never a double-credit.
          await creditXpAndSettle(
            adminClient,
            userId,
            row,
            xpAmount,
            reason,
            row.reference_id,
            "lesson" // #736 — the "xp" action credits lesson-completion XP
          );
          continue; // settlement (resolve / cap-defer / retry) handled inside
        }

        // The on-chain leg of a daily-quest credit that already landed in the
        // DB (enqueued by creditQuestXpRows, which only does so for a learner
        // with a linked wallet). Mints the same XP as soulbound Token-2022
        // supply and stamps the resulting signature onto the xp_transactions
        // row so the dashboard Activity feed renders its explorer link.
        //
        // This case can never claw back or block the DB credit: that credit is
        // committed and its own queue row resolved before this row exists. A
        // failure here bumps retry_count like any other Pass-2 action and the
        // learner keeps their XP — only the explorer link is missing until a
        // later drain succeeds.
        //
        // RESERVE-THEN-SEND. `reward_xp` has no receipt PDA and no nonce, so
        // unlike award_achievement the chain cannot reject a duplicate: whoever
        // sends twice, mints twice. Three real double-mint paths converge here
        // — a confirmation timeout on a tx that actually landed, a serverless
        // kill between send and the DB write (the drain is fire-and-forget at
        // every auth call site), and two overlapping drains reading the same
        // NULL signature. All three are closed the same way: learn the
        // signature by signing FIRST, claim it in the DB with a conditional
        // update, and only then broadcast. Losing the claim race means another
        // drain owns this mint — resolve and send nothing. A crash after the
        // claim leaves at worst a phantom signature: a row pointing at a tx
        // that never landed, which errs toward under-minting (the DB XP is
        // already correct) and is reconcilable with getSignatureStatus.
        case "quest_xp_mint": {
          const xpAmount = payload.xpAmount;
          if (
            typeof xpAmount !== "number" ||
            !Number.isFinite(xpAmount) ||
            !Number.isInteger(xpAmount) ||
            xpAmount <= 0
          ) {
            throw new Error(
              `Invalid quest_xp_mint payload: xpAmount=${JSON.stringify(xpAmount)}`
            );
          }

          // Over the on-chain per-call cap the program WILL reject the mint, so
          // retrying just burns the 5-attempt budget and abandons the row in
          // silence. Defer instead (no retry burn, loud marker): the fix is an
          // operator lowering the quest's XP or raising the registered
          // MinterRole cap, and the row lands on the next drain once they do.
          if (xpAmount > MAX_QUEST_MINT_XP) {
            await deferForMintCap(adminClient, row, xpAmount);
            continue;
          }

          // Double-mint guard, and the reason a re-sweep is safe on top of the
          // resolved_at filter: the xp_transactions row this mint belongs to is
          // found by the SAME idempotency key award_xp used (reference_id), and
          // a signature already sitting there means an earlier attempt already
          // claimed this mint. Skip the chain and resolve. Note award_xp never
          // sets tx_signature for a quest credit, so a non-null value here can
          // only be this handler's own claim.
          const { data: xpRow, error: xpRowError } = await adminClient
            .from("xp_transactions")
            .select("id, tx_signature")
            .eq("user_id", userId)
            .eq("idempotency_key", row.reference_id)
            .maybeSingle();
          if (xpRowError) throw new Error(xpRowError.message);

          // No ledger row means the credit this mint mirrors is not visible
          // (a replica lag, or the credit was rolled back). Minting anyway
          // would put XP on-chain that the ledger does not account for, so
          // fail into the ordinary retry path instead.
          if (!xpRow) {
            throw new Error(
              `No xp_transactions row for quest credit ${row.reference_id} — not minting`
            );
          }
          if (xpRow.tx_signature) break; // already claimed → just resolve

          const memo =
            typeof payload.memo === "string" && payload.memo.length > 0
              ? payload.memo.slice(0, 64)
              : `daily_quest:${row.reference_id}`;

          // 1. Build and SIGN — the signature is now known, nothing is sent.
          //    Deliberately not wrapped in withRetry: a rebuild would take a
          //    fresh blockhash and produce a DIFFERENT signature, which is the
          //    double-mint this whole structure exists to prevent. A build
          //    failure is safe to retry at the row level (nothing was sent).
          const signedTx = await buildSignedRewardXpTx(wallet, xpAmount, memo);

          // 2. CLAIM the signature. `.is("tx_signature", null)` makes this the
          //    mutual-exclusion point: exactly one concurrent drain gets rows
          //    back, the loser gets zero and must not send.
          const { data: claimed, error: claimError } = await adminClient
            .from("xp_transactions")
            .update({ tx_signature: signedTx.signature })
            .eq("id", xpRow.id)
            .is("tx_signature", null)
            .select("id");
          if (claimError) throw new Error(claimError.message);

          if (!claimed || claimed.length === 0) {
            // Another drain claimed it between our read and our update. It owns
            // the send; resolving here is correct and sends nothing.
            break;
          }

          // 3. Send the SAME signed bytes. Re-sending an identical signed
          //    transaction is idempotent on Solana, so the RPC-level rebroadcast
          //    inside sendSignedTransaction can never mint twice.
          try {
            await sendSignedTransaction(signedTx);
          } catch (sendErr) {
            const message =
              sendErr instanceof Error ? sendErr.message : String(sendErr);

            if (sendErr instanceof TransactionNotBroadcastError) {
              // The broadcast was REJECTED — nothing reached the cluster, so no
              // mint exists and the claim is protecting nothing. Keeping it
              // would forfeit the mint permanently: every later sweep would see
              // a non-null tx_signature and resolve without ever sending. That
              // is a real outage shape, not a corner case — pausing the program
              // on-chain (independent of the DB freeze gate) fails preflight for
              // every quest mint in the window. RELEASE the claim so the row
              // retries normally. The `.eq("tx_signature", <our sig>)` makes the
              // release safe under any interleaving: it can only clear OUR
              // claim, never one another drain has since written.
              await releaseMintClaim(adminClient, xpRow.id, signedTx.signature);
              throw new Error(`quest mint was not broadcast: ${message}`);
            }

            // Confirmation failed or timed out: genuinely ambiguous — the
            // transaction may have landed. KEEP the claim, so the next sweep
            // resolves this row instead of minting a second time. The signature
            // goes into last_error so an operator can settle it on-chain.
            throw new Error(
              `quest mint send failed after claiming signature ${signedTx.signature} (verify on-chain before re-minting): ${message}`
            );
          }
          break;
        }

        case "enroll": {
          const courseId = payload.courseId as string;
          const txSignature = payload.txSignature as string;
          const walletAddress = payload.walletAddress as string;

          // Guard: verify the EnrollmentPDA still exists before writing the DB row.
          // Use the wallet from the payload, not the current wallet — the user may
          // have rotated their wallet between the failed sync and this retry.
          const enrollmentWallet = new PublicKey(walletAddress);
          const enrollmentAccount = await fetchEnrollment(
            courseId,
            enrollmentWallet,
            connection,
            getProgramId()
          );
          if (!enrollmentAccount) {
            throw new Error(
              `EnrollmentPDA not found for course ${courseId} — skipping DB sync`
            );
          }

          // Use the original enrollment timestamp from the payload to avoid writing
          // the retry time (which may be hours/days later) as enrolled_at.
          const enrolledAt =
            (payload.enrolledAt as string | undefined) ??
            new Date().toISOString();

          const { error: upsertError } = await adminClient
            .from("enrollments")
            .upsert(
              {
                user_id: userId,
                course_id: courseId,
                enrolled_at: enrolledAt,
                tx_signature: txSignature,
                wallet_address: walletAddress,
              },
              { onConflict: "user_id,course_id" }
            );
          if (upsertError) throw new Error(upsertError.message);
          break;
        }

        default: {
          throw new Error(`Unknown action_type: ${actionType as string}`);
        }
      }

      await adminClient
        .from("pending_onchain_actions")
        .update({ resolved_at: new Date().toISOString() })
        .eq("id", row.id);
    } catch (err) {
      // describeTxError, not err.message: Anchor destroys the message of any
      // transaction that failed AFTER broadcast, leaving the useless literal
      // "Unknown action 'undefined'" as the whole error (see the helper).
      const message = describeTxError(err);
      const nextRetryCount = (row.retry_count ?? 0) + 1;
      await adminClient
        .from("pending_onchain_actions")
        .update({
          retry_count: nextRetryCount,
          last_error: message,
        })
        .eq("id", row.id);

      // At the cap the fetch filter stops selecting this row, so no later drain
      // will ever see it again. Say so once, with the identity an operator needs
      // to requeue it, instead of letting it disappear.
      if (nextRetryCount >= MAX_RETRIES) {
        console.error(
          `[onchain-queue] row ${row.id} (${row.action_type} ${row.reference_id}, user ${userId}) exhausted its ${MAX_RETRIES}-attempt budget and will no longer be retried: ${message}`
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Maintenance-gate deferral (WS-2 #453 rail 3 / adversarial-review fix)
// ---------------------------------------------------------------------------
// A close+recreate (lib/admin/recreate-course.ts) briefly removes the Course
// PDA — `enroll` / `complete_lesson` / `finalize_course` all revert during that
// window because there is no account to read. Before this fix, a login-
// triggered drain treated that revert as an ordinary transient failure and
// bumped retry_count; a login during an extended outage (or several logins
// across one) could push retry_count to 5, at which point the fetch filter
// `.lt("retry_count", 5)` excludes the row FOREVER — the queued
// finalize/credential is abandoned even after the operator redeploys the
// course. Mirrors the daily-cap deferral in `creditXpAndSettle`: leave the row
// unresolved, record why, and do NOT touch retry_count, so the next drain
// (another login, or the narrower quest sweep's sibling paths) retries once
// the gate clears.
//
// F5 — this write itself must not become a NEW abandonment vector. Before this
// fix, a transient DB error writing the defer marker threw out of this
// function, past the caller's `continue`, and into the switch's outer
// try/catch — which bumps retry_count exactly like an ordinary on-chain
// failure. That reintroduces the bug this deferral exists to close: a login
// during a recreate, hitting a flaky DB write, would burn a retry attempt
// instead of deferring. So the write is wrapped here: log and swallow on
// failure, and the caller's `continue` right after this call still skips the
// on-chain action for this sweep either way — retry_count is left untouched
// whether the marker write succeeds or not, so the next drain gets a fresh
// look once the gate clears.
async function deferForCourseMaintenance(
  adminClient: AdminClient,
  row: PendingActionRow,
  courseId: string
): Promise<void> {
  try {
    const { error } = await adminClient
      .from("pending_onchain_actions")
      .update({ last_error: `course-in-maintenance:${courseId}` })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[onchain-queue] ${courseId}: failed to write maintenance-defer marker for row ${row.id}: ${message}`
    );
  }
}

// LX-E2 capstone-gate deferral. Same contract as deferForCourseMaintenance:
// leave the row unresolved, record why, and do NOT touch retry_count, so a
// capstone credential queued before its verified deploy is neither minted
// ungated nor abandoned (the < 5 retry budget is never burned). The next drain
// re-checks the gate and mints the moment the `deployed_programs` row appears.
// Log-and-swallow a marker-write failure for the same F5 reason: a transient DB
// error must not fall through to the caller's outer catch and bump retry_count.
async function deferForCapstoneGate(
  adminClient: AdminClient,
  row: PendingActionRow,
  courseId: string,
  reason: string
): Promise<void> {
  try {
    const { error } = await adminClient
      .from("pending_onchain_actions")
      .update({ last_error: `capstone-gate-${reason}:${courseId}` })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[onchain-queue] ${courseId}: failed to write capstone-gate-defer marker for row ${row.id}: ${message}`
    );
  }
}

// Undo a signature claim whose transaction was never broadcast. Conditional on
// the claim still being OURS, so it can never clear a claim a concurrent drain
// wrote in the meantime. A failure here is logged and swallowed: the caller is
// already throwing into the retry path, and a stuck claim degrades to the
// phantom-signature case (recoverable) rather than an exception that would mask
// the real send error.
async function releaseMintClaim(
  adminClient: AdminClient,
  xpTransactionId: string,
  signature: string
): Promise<void> {
  try {
    const { error } = await adminClient
      .from("xp_transactions")
      .update({ tx_signature: null })
      .eq("id", xpTransactionId)
      .eq("tx_signature", signature);
    if (error) throw new Error(error.message);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[onchain-queue] failed to release unbroadcast mint claim ${signature} on xp_transactions ${xpTransactionId}: ${message}`
    );
  }
}

// Per-call mint-cap deferral. Same contract as the deferrals above: leave the
// row unresolved, record why, do NOT touch retry_count. An amount over the
// registered MinterRole's max_xp_per_call reverts on-chain every single time,
// so retrying would silently abandon the row after 5 attempts; deferring keeps
// it alive (and visible in last_error) until an operator lowers the quest's XP
// or re-registers the minter with a higher cap. Log-and-swallow a marker-write
// failure for the same F5 reason documented above.
async function deferForMintCap(
  adminClient: AdminClient,
  row: PendingActionRow,
  amount: number
): Promise<void> {
  const marker = `quest-mint-over-cap:${amount}>${MAX_QUEST_MINT_XP}`;
  console.error(
    `[onchain-queue] row ${row.id} (${row.reference_id}) requests ${amount} XP, over the minter's per-call cap of ${MAX_QUEST_MINT_XP} — deferring`
  );
  try {
    const { error } = await adminClient
      .from("pending_onchain_actions")
      .update({ last_error: marker })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[onchain-queue] failed to write mint-cap-defer marker for row ${row.id}: ${message}`
    );
  }
}

// GLOBAL deploy-window freeze deferral (reset wave B2). Same contract as
// deferForCourseMaintenance, but for the platform-wide freeze rather than a
// single course: leave the row unresolved, record why, and do NOT touch
// retry_count. Log-and-swallow on a marker-write failure for the exact F5
// reason documented above — a transient DB error writing the marker must not
// fall through to the caller and be mistaken for an on-chain failure that bumps
// retry_count. The caller skips the on-chain action for this sweep regardless.
async function deferForPlatformFreeze(
  adminClient: AdminClient,
  row: PendingActionRow
): Promise<void> {
  try {
    const { error } = await adminClient
      .from("pending_onchain_actions")
      .update({ last_error: "platform-frozen" })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[onchain-queue] failed to write platform-freeze-defer marker for row ${row.id}: ${message}`
    );
  }
}
