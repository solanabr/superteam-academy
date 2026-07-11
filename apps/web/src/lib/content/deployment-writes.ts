import "server-only";

import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import type {
  DeploymentStatus,
  OnchainDeploymentRow,
} from "@/lib/content/deployments";

/**
 * On-chain deployment WRITE seam (SP2-B Task 6).
 *
 * The four writer sites that used to patch a managed doc's frozen
 * `onChainStatus` overlay in Sanity now upsert the Supabase
 * `onchain_deployments` table (the read side lives in
 * {@link file://./deployments.ts}). These functions KEEP THEIR ORIGINAL
 * SIGNATURES so their call sites (courses/sync, achievements/sync,
 * courses/{deactivate,reactivate}) are untouched; `lib/sanity/admin-mutations.ts`
 * re-exports them so imports of `@/lib/sanity/admin-mutations` stay valid until
 * SP2-C repoints them and deletes the re-export.
 *
 * All writes go through the service-role client (RLS-bypassing; the base table
 * has RLS on with no policies — service_role only, house pattern). Each upsert
 * is keyed on the `content_id` PK and sets ONLY the columns that writer owns —
 * matching the old `.patch().set()` merge semantics: an `ON CONFLICT DO UPDATE`
 * touches only the supplied columns, leaving the rest of the row intact.
 */

/**
 * The upsert payload: `content_id` + `kind` are always set (both NOT NULL on the
 * table); every other column is optional and set per-writer — so an
 * `ON CONFLICT DO UPDATE` touches only the columns that writer owns.
 */
type DeploymentUpsert = {
  content_id: string;
  kind: "course" | "achievement";
  status?: string | null;
  course_pda?: string | null;
  tx_signature?: string | null;
  collection_address?: string | null;
  track_collection_address?: string | null;
  achievement_pda?: string | null;
  is_active?: boolean | null;
  last_synced?: string | null;
  updated_at?: string | null;
};

/**
 * supabase-js's `.upsert()`/`.select()` overloads require each relation's
 * `Row`/`Insert` to be assignable to `Record<string, unknown>`. An `interface`
 * (like the read seam's {@link OnchainDeploymentRow}) is NOT — interfaces carry
 * no implicit index signature — which collapses the `.upsert()` value type to
 * `never`. Re-mapping the interface through `{ [K in keyof T]: T[K] }` yields an
 * equivalent object-literal alias that IS index-signature compatible, keeping
 * the client fully typed with zero `any` while reusing the read seam's shapes.
 */
type WriteRow = { [K in keyof OnchainDeploymentRow]: OnchainDeploymentRow[K] };
type WriteViewRow = { [K in keyof DeploymentStatus]: DeploymentStatus[K] };

/**
 * Minimal Supabase schema for the write. The generated `Database` type does not
 * yet carry `onchain_deployments` (the SP2-B migration adds it; types regenerate
 * in a follow-up), so — like the read seam — we pin exactly the one relation
 * this module writes.
 */
interface WriteSchema {
  public: {
    Tables: {
      onchain_deployments: {
        Row: WriteRow;
        Insert: DeploymentUpsert;
        Update: Partial<DeploymentUpsert>;
        Relationships: [];
      };
    };
    Views: {
      public_onchain_deployments: {
        Row: WriteViewRow;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

/** Service-role client typed for this seam (mirrors `lib/supabase/admin.ts`). */
function createServiceClient() {
  return createClient<WriteSchema>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY
  );
}

/** Upsert the columns a single writer owns, keyed on the `content_id` PK. */
async function upsertDeployment(row: DeploymentUpsert): Promise<void> {
  const { error } = await createServiceClient()
    .from("onchain_deployments")
    .upsert(
      { ...row, updated_at: new Date().toISOString() },
      { onConflict: "content_id" }
    );
  if (error) {
    throw new Error(
      `onchain_deployments upsert failed for ${row.content_id}: ${error.message}`
    );
  }
}

export async function writeCourseOnChainStatus(
  sanityId: string,
  status: string,
  coursePda: string,
  txSignature: string
): Promise<void> {
  await upsertDeployment({
    content_id: sanityId,
    kind: "course",
    status,
    course_pda: coursePda,
    tx_signature: txSignature,
    last_synced: new Date().toISOString(),
  });
}

/**
 * Mirror a course's on-chain `is_active` flag into Supabase so the public
 * catalog can hide a deactivated course (issue #321). The catalog gate reads
 * `is_active`; the on-chain tx alone doesn't touch the deployment row, so the
 * deactivate/reactivate routes call this after the tx succeeds.
 */
export async function writeCourseActive(
  sanityId: string,
  isActive: boolean
): Promise<void> {
  await upsertDeployment({
    content_id: sanityId,
    kind: "course",
    is_active: isActive,
  });
}

export async function writeCourseTrackCollection(
  sanityId: string,
  trackCollectionAddress: string
): Promise<void> {
  await upsertDeployment({
    content_id: sanityId,
    kind: "course",
    track_collection_address: trackCollectionAddress,
  });
}

export async function writeAchievementOnChainStatus(
  sanityId: string,
  achievementPda: string,
  collectionAddress: string
): Promise<void> {
  await upsertDeployment({
    content_id: sanityId,
    kind: "achievement",
    status: "synced",
    achievement_pda: achievementPda,
    collection_address: collectionAddress,
    last_synced: new Date().toISOString(),
  });
}
