import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const MAX_PAID_ASSISTS = 4;

export async function spendAssist(
  userId: string,
  lessonId: string
): Promise<{ allowed: boolean; used: number }> {
  try {
    const { data, error } = await createAdminClient().rpc(
      "spend_challenge_assist",
      {
        p_user_id: userId,
        p_lesson_id: lessonId,
        p_max_paid: MAX_PAID_ASSISTS,
      }
    );
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row || typeof row.allowed !== "boolean") {
      console.warn(
        "[assist-budget] spend failed, denying:",
        error?.message ?? JSON.stringify(data)
      );
      return { allowed: false, used: MAX_PAID_ASSISTS };
    }
    return { allowed: row.allowed, used: row.used };
  } catch (err) {
    console.warn("[assist-budget] spend threw, denying:", err);
    return { allowed: false, used: MAX_PAID_ASSISTS };
  }
}

export async function getAssistsUsed(
  userId: string,
  lessonId: string
): Promise<number> {
  try {
    const { data, error } = await createAdminClient().rpc(
      "get_challenge_assists",
      {
        p_user_id: userId,
        p_lesson_id: lessonId,
      }
    );
    if (error || typeof data !== "number") return MAX_PAID_ASSISTS;
    return data;
  } catch {
    return MAX_PAID_ASSISTS;
  }
}

export async function resetAssists(
  userId: string,
  lessonId: string
): Promise<void> {
  try {
    await createAdminClient().rpc("reset_challenge_assists", {
      p_user_id: userId,
      p_lesson_id: lessonId,
    });
  } catch (err) {
    console.warn("[assist-budget] reset failed:", err);
  }
}
