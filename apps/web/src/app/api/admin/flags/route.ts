import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/rate-limit";
import { locales, defaultLocale } from "@/lib/i18n/config";

// Reads the admin cookie + service-role DB — never statically prerender.
export const dynamic = "force-dynamic";

/**
 * Admin gate. Returns the 401 response to send, or the acting admin's user id
 * so the caller can attribute what it writes.
 */
async function guard(
  req: NextRequest
): Promise<{ denied: NextResponse } | { userId: string }> {
  try {
    const { userId } = await requireAdminAuth(req);
    return { userId };
  } catch (e) {
    if (e instanceof AdminAuthError)
      return { denied: adminUnauthorizedResponse() };
    throw e;
  }
}

/**
 * Locale for the links this route hands the panel. `localePrefix: "always"`
 * means an unprefixed `/community/...` href is not a valid app path — it gets
 * redirected by the intl middleware at best, and 404s inside the app router at
 * worst — so the queue's "View" link was effectively broken.
 *
 * The locale comes from the Referer, because the only caller is the admin panel
 * at `/{locale}/admin` and that is the locale the moderator is actually reading
 * in. Anything unrecognised falls back to the default locale rather than
 * emitting a prefix-less path.
 */
function localeFromReferer(req: NextRequest): string {
  const referer = req.headers.get("referer");
  if (!referer) return defaultLocale;
  try {
    const first = new URL(referer).pathname.split("/")[1] ?? "";
    return (locales as readonly string[]).includes(first)
      ? first
      : defaultLocale;
  } catch {
    return defaultLocale;
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
  /**
   * The reported content in full (thread body or answer body). The card falls
   * back to showing this when `url` is null — a moderator must never be asked to
   * decide from a truncated preview with no way to read the post.
   */
  body: string;
  url: string | null;
}

/**
 * GET /api/admin/flags — pending community flags for the moderation queue, each
 * resolved to a target preview + link. Service-role read (the `flags` table is
 * not readable by normal users). Assembled in-app from small `.in()` fetches
 * rather than PostgREST embedding to keep the FK-hint surface simple.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await guard(req);
  if ("denied" in auth) return auth.denied;

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
          .select("id, title, slug, category_id, body")
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

  const locale = localeFromReferer(req);
  const result: ModerationFlag[] = rows.map((f) => {
    const isThread = !!f.thread_id;
    const answer = f.answer_id ? answerMap.get(f.answer_id) : undefined;
    const threadId = isThread ? f.thread_id : (answer?.thread_id ?? null);
    const thread = threadId ? threadMap.get(threadId) : undefined;
    const preview = isThread ? (thread?.title ?? "") : (answer?.body ?? "");
    const slug = thread?.category_id
      ? categorySlug.get(thread.category_id)
      : undefined;
    const url =
      thread && slug ? `/${locale}/community/${slug}/${thread.slug}` : null;
    return {
      id: f.id,
      reason: f.reason,
      details: f.details,
      createdAt: f.created_at,
      reporter: reporterName.get(f.reporter_id) ?? null,
      targetType: isThread ? "thread" : "answer",
      preview: preview.slice(0, 200),
      body: isThread ? (thread?.body ?? "") : (answer?.body ?? ""),
      url,
    };
  });

  return NextResponse.json({ flags: result });
}

type ModerationAction = "resolve" | "dismiss" | "remove" | "lock";

const ACTIONS: readonly ModerationAction[] = [
  "resolve",
  "dismiss",
  "remove",
  "lock",
];

/** The audit `action` value each request writes, once the target is known. */
type AuditAction =
  | "removed_thread"
  | "removed_answer"
  | "locked_thread"
  | "resolved"
  | "dismissed";

/**
 * POST { flagId, action: "resolve" | "dismiss" | "remove" | "lock" }
 *
 * `remove` soft-deletes the reported content (and auto-resolves the flag);
 * `lock` locks the reported thread and LEAVES the flag pending, because a lock
 * stops the argument without settling the report — the moderator still resolves
 * or dismisses it. `resolve` / `dismiss` are unchanged: they record a decision
 * about the report only.
 *
 * Rate-limited per admin: these actions now destroy content, so a stuck client
 * (or a stolen session) cannot loop them.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await guard(req);
  if ("denied" in auth) return auth.denied;

  let flagId: string;
  let action: ModerationAction;
  try {
    const body = (await req.json()) as { flagId?: unknown; action?: unknown };
    if (typeof body.flagId !== "string" || body.flagId.length === 0) {
      return NextResponse.json(
        { error: "flagId is required" },
        { status: 400 }
      );
    }
    if (!ACTIONS.includes(body.action as ModerationAction)) {
      return NextResponse.json(
        { error: `action must be one of ${ACTIONS.join(", ")}` },
        { status: 400 }
      );
    }
    flagId = body.flagId;
    action = body.action as ModerationAction;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    await isRateLimited("admin-moderate", auth.userId, {
      maxTokens: 60,
      refillIntervalMs: 60_000,
    })
  ) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const admin = createAdminClient();

  // The target comes from the flag row, never from the request body — a client
  // can name a flag, not a thread to delete.
  const { data: flag, error: flagError } = await admin
    .from("flags")
    .select("id, thread_id, answer_id")
    .eq("id", flagId)
    .maybeSingle();

  if (flagError) {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  if (!flag) {
    return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  }

  const threadId = flag.thread_id;
  const answerId = flag.answer_id;

  let auditAction: AuditAction;

  if (action === "remove") {
    let rpc;
    if (threadId !== null) {
      rpc = await admin.rpc("moderate_soft_delete_thread", {
        p_thread_id: threadId,
      });
    } else if (answerId !== null) {
      rpc = await admin.rpc("moderate_soft_delete_answer", {
        p_answer_id: answerId,
      });
    } else {
      // chk_flag_target_exclusive makes this unreachable; a flag with no target
      // is corrupt data, not a request to remove nothing.
      return NextResponse.json(
        { error: "Flag has no target" },
        { status: 500 }
      );
    }
    if (rpc.error) {
      // The RPCs raise on a target that is missing or already tombstoned. That
      // is a conflict, not a server fault, and must not read as "try again".
      const gone = /already removed/i.test(rpc.error.message ?? "");
      console.error("Admin moderation remove failed:", rpc.error.message);
      return NextResponse.json(
        { error: gone ? "Content already removed" : "Remove failed" },
        { status: gone ? 409 : 500 }
      );
    }
    auditAction = threadId ? "removed_thread" : "removed_answer";
  } else if (action === "lock") {
    if (!threadId) {
      return NextResponse.json(
        { error: "lock applies to thread reports only" },
        { status: 400 }
      );
    }
    const { error: lockError } = await admin
      .from("threads")
      .update({ is_locked: true })
      .eq("id", threadId);
    if (lockError) {
      console.error("Admin moderation lock failed:", lockError.message);
      return NextResponse.json({ error: "Lock failed" }, { status: 500 });
    }
    auditAction = "locked_thread";
  } else {
    auditAction = action === "resolve" ? "resolved" : "dismissed";
  }

  // `remove` settles the report as well as the content; `lock` does not.
  if (action !== "lock") {
    const { error } = await admin
      .from("flags")
      .update({
        status: action === "dismiss" ? "dismissed" : "resolved",
        resolved_at: new Date().toISOString(),
        resolved_by: auth.userId,
      })
      .eq("id", flagId);

    if (error) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
  }

  // Audit last, so it only ever records what actually happened. A failure here
  // is reported (`audited: false`) rather than turned into a 500: the content
  // action already landed, and a 500 would invite a destructive retry.
  const { error: auditError } = await admin.from("moderation_actions").insert({
    action: auditAction,
    thread_id: threadId,
    answer_id: answerId,
    flag_id: flagId,
    actor_id: auth.userId,
  });
  if (auditError) {
    console.error("Moderation audit write failed:", auditError.message);
  }

  return NextResponse.json({ success: true, audited: !auditError });
}
