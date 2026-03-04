import { db } from "@/lib/db";
import { admin_logs } from "@/lib/db/schema";

export type InstructionType =
  | "lesson_complete"
  | "challenge_reward_xp"
  | "finalize_course"
  | "issue_credential"
  | "award_achievement";

export async function log_transaction(params: {
  user_id: string;
  wallet_public_key: string;
  tx_signature: string | null;
  instruction_type: InstructionType;
  success: boolean;
  error?: string | null;
}): Promise<void> {
  const { user_id, wallet_public_key, tx_signature, instruction_type, success, error } = params;

  await db.insert(admin_logs).values({
    admin_id: user_id,
    action: "tx_log",
    target_type: "tx",
    target_id: tx_signature ?? null,
    metadata: {
      user_id,
      wallet_public_key,
      tx_signature,
      instruction_type,
      success,
      error: error ?? null,
    },
  });
}

