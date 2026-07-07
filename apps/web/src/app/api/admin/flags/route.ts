import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Reads the admin cookie + service-role DB — never statically prerender.
export const dynamic = "force-dynamic";

function guard(req: NextRequest): NextResponse | null {
  try {
    requireAdminAuth(req);
    return null;
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }
}

export interface ModerationFlag {
  id: string;
  reason: string;
  details: string | null;
  createdAt: string;
  reporter: string | null;
  targetType: "thread" | "answer";
  preview: string;
  url: string | null;
}

/**
 * GET /api/admin/flags — pending community flags for the moderation queue, each
 * resolved to a target preview + link. Service-role read (the `flags` table is
 * not readable by normal users). Assembled in-app from small `.in()` fetches
 * rather than PostgREST embedding to keep the FK-hint surface simple.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const denied = guard(req);
  if (denied) return denied;

  const admin = createAdminClient();
  const { data: flags, error } = await admin
    .from("flags")
    .select(
      "id, reason, details, created_at, reporter_id, thread_id, answer_id"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  const rows = flags ?? [];

  const answerIds = rows
    .map((f) => f.answer_id)
    .filter((id): id is string => !!id);
  const answers = answerIds.length
    ? ((
        await admin
          .from("answers")
          .select("id, body, thread_id")
          .in("id", answerIds)
      ).data ?? [])
    : [];
  const answerMap = new Map(answers.map((a) => [a.id, a]));

  const threadIds = Array.from(
    new Set([
      ...rows.map((f) => f.thread_id).filter((id): id is string => !!id),
      ...answers.map((a) => a.thread_id),
    ])
  );
  const threads = threadIds.length
    ? ((
        await admin
          .from("threads")
          .select("id, title, slug, category_id")
          .in("id", threadIds)
      ).data ?? [])
    : [];
  const threadMap = new Map(threads.map((t) => [t.id, t]));

  const categoryIds = Array.from(
    new Set(
      threads.map((t) => t.category_id).filter((id): id is string => !!id)
    )
  );
  const categories = categoryIds.length
    ? ((
        await admin
          .from("forum_categories")
          .select("id, slug")
          .in("id", categoryIds)
      ).data ?? [])
    : [];
  const categorySlug = new Map(categories.map((c) => [c.id, c.slug]));

  const reporterIds = Array.from(new Set(rows.map((f) => f.reporter_id)));
  const reporters = reporterIds.length
    ? ((
        await admin
          .from("profiles")
          .select("id, username")
          .in("id", reporterIds)
      ).data ?? [])
    : [];
  const reporterName = new Map(reporters.map((r) => [r.id, r.username]));

  const result: ModerationFlag[] = rows.map((f) => {
    const isThread = !!f.thread_id;
    const answer = f.answer_id ? answerMap.get(f.answer_id) : undefined;
    const threadId = isThread ? f.thread_id : (answer?.thread_id ?? null);
    const thread = threadId ? threadMap.get(threadId) : undefined;
    const preview = isThread ? (thread?.title ?? "") : (answer?.body ?? "");
    const slug = thread?.category_id
      ? categorySlug.get(thread.category_id)
      : undefined;
    const url = thread && slug ? `/community/${slug}/${thread.slug}` : null;
    return {
      id: f.id,
      reason: f.reason,
      details: f.details,
      createdAt: f.created_at,
      reporter: reporterName.get(f.reporter_id) ?? null,
      targetType: isThread ? "thread" : "answer",
      preview: preview.slice(0, 200),
      url,
    };
  });

  return NextResponse.json({ flags: result });
}

/** POST { flagId, action: "resolve" | "dismiss" } — action a pending flag. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const denied = guard(req);
  if (denied) return denied;

  let flagId: string;
  let action: "resolve" | "dismiss";
  try {
    const body = (await req.json()) as { flagId?: unknown; action?: unknown };
    if (typeof body.flagId !== "string" || body.flagId.length === 0) {
      return NextResponse.json(
        { error: "flagId is required" },
        { status: 400 }
      );
    }
    if (body.action !== "resolve" && body.action !== "dismiss") {
      return NextResponse.json(
        { error: "action must be 'resolve' or 'dismiss'" },
        { status: 400 }
      );
    }
    flagId = body.flagId;
    action = body.action;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const admin = createAdminClient();
  // resolved_by is left null: the admin_session cookie is not a Supabase user,
  // so there's no profile id to attribute. status + resolved_at are enough.
  const { error } = await admin
    .from("flags")
    .update({
      status: action === "resolve" ? "resolved" : "dismissed",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", flagId);

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
