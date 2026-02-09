import type { LearningProgressService } from "@superteam-lms/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { HybridProgressService } from "./hybrid-progress-service";
import type { Database } from "@/lib/supabase/types";

export function getProgressService(
  supabase: SupabaseClient<Database>
): LearningProgressService {
  return new HybridProgressService(supabase);
}
