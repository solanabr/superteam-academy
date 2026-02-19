import "server-only";

import { PublicKey } from "@solana/web3.js";
import { fetchAchievementReceipt, fetchEnrollment } from "./academy-reads";
import {
  getConnection,
  awardAchievement,
  finalizeCourse,
  issueCredential,
} from "./academy-program";
import { PROGRAM_ID } from "./pda";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

type OnchainActionType =
  | "achievement"
  | "certificate"
  | "course_finalize"
  | "xp";

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
// 2. Queue a failed on-chain action for later retry
// ---------------------------------------------------------------------------

export async function queueFailedOnchainAction(
  userId: string,
  actionType: OnchainActionType,
  referenceId: string,
  payload: Record<string, unknown>,
  error: string
): Promise<void> {
  try {
    const adminClient = createAdminClient();
    await adminClient.from("pending_onchain_actions").upsert(
      {
        user_id: userId,
        action_type: actionType,
        reference_id: referenceId,
        payload,
        last_error: error,
        failed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,action_type,reference_id" }
    );
  } catch (err) {
    logError({
      errorId: ERROR_IDS.LESSON_COMPLETE_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { userId, actionType, referenceId },
    });
  }
}

// ---------------------------------------------------------------------------
// 3. Retry all pending on-chain actions for a user
// ---------------------------------------------------------------------------

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

  const { data: profile } = await adminClient
    .from("profiles")
    .select("wallet_address")
    .eq("id", userId)
    .single();

  if (!profile?.wallet_address) return;

  const wallet = new PublicKey(profile.wallet_address);

  for (const row of rows) {
    try {
      const actionType = row.action_type as OnchainActionType;
      const payload = row.payload as Record<string, unknown>;

      switch (actionType) {
        case "achievement": {
          const achievementId = row.reference_id;
          const exists = await fetchAchievementReceipt(
            achievementId,
            profile.wallet_address,
            connection,
            PROGRAM_ID
          );
          if (!exists) {
            await withRetry(() => awardAchievement(achievementId, wallet));
          }
          const { error: unlockRpcError } = await adminClient.rpc(
            "unlock_achievement",
            {
              p_user_id: userId,
              p_achievement_id: achievementId,
            }
          );
          if (unlockRpcError) throw new Error(unlockRpcError.message);
          break;
        }

        case "certificate": {
          const courseId = payload.courseId as string;
          const metadataId = payload.metadataId as string | undefined;
          if (!metadataId) {
            throw new Error(
              "Cannot retry certificate: missing metadataId in payload"
            );
          }

          const enrollment = (await fetchEnrollment(
            courseId,
            wallet,
            connection,
            PROGRAM_ID
          )) as Record<string, unknown> | null;

          if (!enrollment?.credential_asset) {
            const credentialName = payload.credentialName as string;
            const metadataUri = payload.metadataUri as string;
            const coursesCompleted = (payload.coursesCompleted as number) ?? 1;
            const totalXp = (payload.totalXp as number) ?? 0;
            const trackCollection = new PublicKey(
              payload.trackCollection as string
            );

            const { mintAddress, signature } = await withRetry(() =>
              issueCredential(
                courseId,
                wallet,
                credentialName,
                metadataUri,
                coursesCompleted,
                totalXp,
                trackCollection
              )
            );

            await adminClient.from("certificates").upsert(
              {
                user_id: userId,
                course_id: courseId,
                course_title: (payload.courseTitle as string) ?? "",
                mint_address: mintAddress.toBase58(),
                metadata_uri: metadataUri,
                tx_signature: signature,
                credential_type: "core",
              },
              { onConflict: "user_id,course_id" }
            );
          }
          break;
        }

        case "course_finalize": {
          const courseId = payload.courseId as string;
          const xpAmount = payload.xpAmount as number;
          const reason =
            (payload.reason as string) ?? `Completed course: ${courseId}`;

          const enrollment = (await fetchEnrollment(
            courseId,
            wallet,
            connection,
            PROGRAM_ID
          )) as Record<string, unknown> | null;

          if (!enrollment?.completed_at) {
            await withRetry(() => finalizeCourse(courseId, wallet));
          }

          const { error: xpRpcError } = await adminClient.rpc("award_xp", {
            p_user_id: userId,
            p_amount: xpAmount,
            p_reason: reason,
          });
          if (xpRpcError) throw new Error(xpRpcError.message);
          break;
        }

        case "xp": {
          const lessonId = payload.lessonId as string;
          const xpAmount = payload.xpAmount as number;
          const reason =
            (payload.reason as string) ?? `Completed lesson: ${lessonId}`;

          // DB-level dedup via idempotency_key — ON CONFLICT DO NOTHING if already awarded
          const { error: xpRpcError } = await adminClient.rpc("award_xp", {
            p_user_id: userId,
            p_amount: xpAmount,
            p_reason: reason,
            p_idempotency_key: row.reference_id,
          });
          if (xpRpcError) throw new Error(xpRpcError.message);
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
          retry_count: row.retry_count + 1,
          last_error: message,
        })
        .eq("id", row.id);
    }
  }
}
