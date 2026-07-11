import "server-only";

import { PublicKey } from "@solana/web3.js";
import { getProgramId } from "./pda";
import {
  getConnection,
  awardAchievement,
  finalizeCourse,
  issueCredential,
} from "./academy-program";
import {
  fetchAchievementReceipt,
  fetchEnrollment,
  fetchCourse,
} from "./academy-reads";
import { getCourseById } from "@/lib/content/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

type OnchainActionType =
  | "achievement"
  | "certificate"
  | "course_finalize"
  | "xp"
  | "quest_xp"
  | "enroll";

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
// creditQuestXpRows() for how delivery is made idempotent.

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
    .lt("retry_count", 5);

  if (fetchError || !rows || rows.length === 0) return;

  // ── Pass 1: DB-only quest_xp credits (no wallet required) ──
  await creditQuestXpRows(
    adminClient,
    userId,
    rows.filter((row) => row.action_type === "quest_xp")
  );

  // ── Pass 2: on-chain actions (all require a linked wallet) ──
  if (!rows.some((r) => r.action_type !== "quest_xp")) return;

  const { data: profile } = await adminClient
    .from("profiles")
    .select("wallet_address")
    .eq("id", userId)
    .single();

  if (!profile?.wallet_address) return;

  const wallet = new PublicKey(profile.wallet_address);

  for (const row of rows) {
    if (row.action_type === "quest_xp") continue; // handled in Pass 1
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

          const enrollment = (await fetchEnrollment(
            courseId,
            wallet,
            connection,
            getProgramId()
          )) as Record<string, unknown> | null;

          // Already issued on-chain — just resolve the queue entry
          if (enrollment?.credential_asset) break;

          // Derive all fields fresh from Sanity + on-chain (self-sufficient retry)
          const sanityCourse = await getCourseById(courseId);
          if (!sanityCourse) {
            throw new Error(`Course "${courseId}" not found in Sanity`);
          }

          const trackCollectionAddress = sanityCourse.trackCollectionAddress as
            | string
            | undefined;
          if (!trackCollectionAddress) {
            throw new Error(
              `Course "${courseId}" has no trackCollectionAddress — sync the course first`
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
              (Number(onChainCourse.lesson_count) || 1)
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
              row.reference_id
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
            row.reference_id
          );
          continue; // settlement (resolve / cap-defer / retry) handled inside
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
      const message = err instanceof Error ? err.message : String(err);
      await adminClient
        .from("pending_onchain_actions")
        .update({
          retry_count: (row.retry_count ?? 0) + 1,
          last_error: message,
        })
        .eq("id", row.id);
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Narrow sweep: deliver this user's pending quest_xp credits (DB-only)
// ---------------------------------------------------------------------------
// Called from the /api/quests/daily GET after get_daily_quest_state succeeds,
// so quest XP lands without waiting for the user's next re-auth (which a
// long-lived session may never hit). No chain calls — fast enough to await.

export async function retryQuestXpForUser(
  adminClient: AdminClient,
  userId: string
): Promise<void> {
  const { data: rows, error: fetchError } = await adminClient
    .from("pending_onchain_actions")
    .select("*")
    .eq("user_id", userId)
    .eq("action_type", "quest_xp")
    .is("resolved_at", null)
    .lt("retry_count", 5);

  if (fetchError || !rows || rows.length === 0) return;

  await creditQuestXpRows(adminClient, userId, rows);
}

// award_xp credits by user_id, so wallet-less (e.g. Google-only) users still
// receive quest XP. The reference_id is the idempotency key, so a re-sweep of
// an already-credited row is a no-op (never a double-award). A row is only
// resolved when award_xp reports a credited amount > 0 — a credit fully eaten
// by the 5000/day cap stays unresolved (without burning a retry) and is
// re-swept once the cap window resets.
async function creditQuestXpRows(
  adminClient: AdminClient,
  userId: string,
  rows: PendingActionRow[]
): Promise<void> {
  for (const row of rows) {
    const payload = row.payload as Record<string, unknown>;
    const xpAmount = payload.xpAmount;
    if (
      typeof xpAmount !== "number" ||
      !Number.isFinite(xpAmount) ||
      xpAmount <= 0
    ) {
      // Malformed payload — a quest_xp row must always carry a positive amount.
      // Treat as a transient failure (bump retry) rather than a silent resolve.
      await bumpRetry(
        adminClient,
        row,
        `Invalid quest_xp payload: xpAmount=${JSON.stringify(xpAmount)}`
      );
      continue;
    }
    const reason =
      typeof payload.memo === "string"
        ? payload.memo
        : `daily_quest:${row.reference_id}`;

    await creditXpAndSettle(
      adminClient,
      userId,
      row,
      xpAmount,
      reason,
      row.reference_id
    );
  }
}

// ---------------------------------------------------------------------------
// 5. Shared XP-credit settlement (durable-delivery contract)
// ---------------------------------------------------------------------------
// Credits one learning-path XP award and settles its queue row. award_xp
// RETURNS the amount actually credited (see
// supabase/migrations/20260709130000_award_xp_report_credited.sql), which is
// the signal used to tell three outcomes apart:
//   • credited > 0  → XP landed (or an idempotency-key duplicate re-reports the
//                     already-credited amount) → mark the row resolved.
//   • credited = 0  → the 5000/day cap ate the whole award. This is a DEFERRAL,
//                     not a failure: leave the row unresolved and do NOT bump
//                     retry_count, so it is re-swept once the cap window resets
//                     instead of silently losing the owed XP (the CS-7 bug).
//   • RPC error     → transient failure → bump retry_count (backoff), as before.
// The award MUST carry an idempotency key so a re-sweep is a no-op, never a
// double-credit — this is what makes deferral safe.
async function creditXpAndSettle(
  adminClient: AdminClient,
  userId: string,
  row: PendingActionRow,
  amount: number,
  reason: string,
  idempotencyKey: string
): Promise<void> {
  try {
    const { data: credited, error: xpRpcError } = await adminClient.rpc(
      "award_xp",
      {
        p_user_id: userId,
        p_amount: amount,
        p_reason: reason,
        p_idempotency_key: idempotencyKey,
      }
    );
    if (xpRpcError) throw new Error(xpRpcError.message);

    if ((credited ?? 0) > 0) {
      await adminClient
        .from("pending_onchain_actions")
        .update({ resolved_at: new Date().toISOString() })
        .eq("id", row.id);
    } else {
      // Daily cap consumed the whole credit — deferral, not failure: keep the
      // row unresolved and do NOT increment retry_count.
      await adminClient
        .from("pending_onchain_actions")
        .update({ last_error: "daily-cap-deferred" })
        .eq("id", row.id);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await bumpRetry(adminClient, row, message);
  }
}

// Transient-failure bookkeeping: bump retry_count and record the error so the
// row is retried under the existing < 5 attempt budget with backoff.
async function bumpRetry(
  adminClient: AdminClient,
  row: PendingActionRow,
  message: string
): Promise<void> {
  await adminClient
    .from("pending_onchain_actions")
    .update({
      retry_count: (row.retry_count ?? 0) + 1,
      last_error: message,
    })
    .eq("id", row.id);
}
