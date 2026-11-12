import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import {
  AdminAuthError,
  adminUnauthorizedResponse,
  requireAdminAuth,
} from "@/lib/admin/auth";
import type { Database } from "@/lib/supabase/types";
import {
  MAX_EVENT_DESCRIPTION,
  MAX_EVENT_NAME,
  MAX_EVENT_XP,
  normalizeEventCode,
} from "./events";
import type { AdminEvent } from "./admin-types";

export type { AdminEvent };

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export function toAdminEvent(row: EventRow, attendees: number): AdminEvent {
  return {
    id: row.id,
    achievementId: row.achievement_id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    xpReward: row.xp_reward,
    code: row.code,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    collectionAddress: row.collection_address,
    deployTx: row.deploy_tx,
    deployedAt: row.deployed_at,
    attendees,
  };
}

export const EVENT_COLUMNS =
  "id, achievement_id, name, description, image_url, xp_reward, code, starts_at, ends_at, created_by, created_at, collection_address, deploy_tx, deployed_at";

/** requireAdminAuth, as a value: the acting admin, or the response to send. */
export async function adminGuard(
  req: NextRequest
): Promise<{ userId: string } | { denied: NextResponse }> {
  try {
    return await requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError)
      return { denied: adminUnauthorizedResponse(e) };
    throw e;
  }
}

export function badRequest(error: string): NextResponse {
  return NextResponse.json({ error }, { status: 400 });
}

export type FieldResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function parseName(value: unknown): FieldResult<string> {
  if (typeof value !== "string") return { ok: false, error: "invalidName" };
  const name = value.trim();
  // The on-chain limit is in bytes, the DB CHECK in characters: hold both.
  if (
    !name ||
    name.length > MAX_EVENT_NAME ||
    new TextEncoder().encode(name).length > MAX_EVENT_NAME
  ) {
    return { ok: false, error: "invalidName" };
  }
  return { ok: true, value: name };
}

export function parseDescription(value: unknown): FieldResult<string> {
  if (value === undefined || value === null) return { ok: true, value: "" };
  if (typeof value !== "string" || value.length > MAX_EVENT_DESCRIPTION) {
    return { ok: false, error: "invalidDescription" };
  }
  return { ok: true, value: value.trim() };
}

export function parseXp(value: unknown): FieldResult<number> {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > MAX_EVENT_XP
  ) {
    return { ok: false, error: "invalidXp" };
  }
  return { ok: true, value };
}

export function parseCode(value: unknown): FieldResult<string> {
  const code = typeof value === "string" ? normalizeEventCode(value) : null;
  return code ? { ok: true, value: code } : { ok: false, error: "invalidCode" };
}

export function parseWindow(
  startsAt: unknown,
  endsAt: unknown
): FieldResult<{ startsAt: string; endsAt: string }> {
  if (typeof startsAt !== "string" || typeof endsAt !== "string") {
    return { ok: false, error: "invalidWindow" };
  }
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    return { ok: false, error: "invalidWindow" };
  }
  return {
    ok: true,
    value: { startsAt: start.toISOString(), endsAt: end.toISOString() },
  };
}

/** Postgres unique violation on the code index. */
export function isCodeTaken(
  error: { code?: string; message?: string } | null
): boolean {
  return (
    error?.code === "23505" && (error.message ?? "").includes("events_code_key")
  );
}
