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

  // Only pending flags are actionable, and the target comes from the flag row,
  // never from the request body — a client can name a flag, not a thread to
  // delete. A non-pending or missing flag is a 404 (already handled, or gone).
  const { data: flag, error: flagError } = await admin
    .from("flags")
    .select("id, thread_id, answer_id")
    .eq("id", flagId)
    .eq("status", "pending")
    .maybeSingle();

  if (flagError) {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  if (!flag) {
    return NextResponse.json(
      { error: "Flag not found or already resolved" },
      { status: 404 }
    );
  }

  const threadId = flag.thread_id;
  const answerId = flag.answer_id;

  // Every branch is ONE RPC that commits the content change, the flag write, and
  // the audit row in a single transaction — so a failure can never leave content
  // removed with no audit trail, or a flag resolved with no record of who did it.
  let rpcError: { message: string } | null;

  if (action === "remove") {
    if (threadId !== null) {
      ({ error: rpcError } = await admin.rpc("moderate_soft_delete_thread", {
        p_thread_id: threadId,
        p_flag_id: flagId,
        p_actor_id: auth.userId,
      }));
    } else if (answerId !== null) {
      ({ error: rpcError } = await admin.rpc("moderate_soft_delete_answer", {
        p_answer_id: answerId,
        p_flag_id: flagId,
        p_actor_id: auth.userId,
      }));
    } else {
      // chk_flag_target_exclusive makes this unreachable; a flag with no target
      // is corrupt data, not a request to remove nothing.
      return NextResponse.json(
        { error: "Flag has no target" },
        { status: 500 }
      );
    }
  } else if (action === "lock") {
    if (threadId === null) {
      return NextResponse.json(
        { error: "lock applies to thread reports only" },
        { status: 400 }
      );
    }
    ({ error: rpcError } = await admin.rpc("moderate_lock_thread", {
      p_thread_id: threadId,
      p_flag_id: flagId,
      p_actor_id: auth.userId,
    }));
  } else {
    ({ error: rpcError } = await admin.rpc("moderate_resolve_flag", {
      p_flag_id: flagId,
      p_dismiss: action === "dismiss",
      p_actor_id: auth.userId,
    }));
  }

  if (rpcError) {
    // The RPCs raise on a target that is missing or already tombstoned/handled.
    // That is a conflict, not a server fault, and must not read as "try again".
    const gone = /already removed|already resolved|not found/i.test(
      rpcError.message ?? ""
    );
    console.error(`Admin moderation ${action} failed:`, rpcError.message);
    return NextResponse.json(
      { error: gone ? "Content already actioned" : "Action failed" },
      { status: gone ? 409 : 500 }
    );
  }

  return NextResponse.json({ success: true });
}
