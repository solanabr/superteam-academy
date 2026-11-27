import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Remove every file in an account's avatar folder. Storage refuses SQL deletes, so
 * this runs outside delete_account_data's transaction. Throws on failure; safe to
 * repeat, since a folder with nothing in it is a no-op.
 */
export async function removeAccountAvatar(
  admin: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  const avatars = admin.storage.from("avatars");
  const { data: files, error: listError } = await avatars.list(userId);
  if (listError) throw new Error(listError.message);
  if (!files || files.length === 0) return;
  const { error: removeError } = await avatars.remove(
    files.map((file) => `${userId}/${file.name}`)
  );
  if (removeError) throw new Error(removeError.message);
}
