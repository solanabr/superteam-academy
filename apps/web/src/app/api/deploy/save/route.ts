import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { getConnection } from "@/lib/solana/academy-program";
import {
  verifyProgramDeployment,
  type DeployVerificationResult,
} from "@/lib/solana/verify-program-deploy";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/logging";

interface SaveDeployRequest {
  lessonId: string;
  courseId: string;
  programId: string;
}

// Auth/cookie + per-request DB access — never statically prerender (DYNAMIC_SERVER_USAGE).
export const dynamic = "force-dynamic";

// One generic message for every on-chain rejection: distinguishing
// missing/non-executable/wrong-authority would hand probers a free oracle
// over arbitrary program ids (#560 / LX-E1).
const VERIFICATION_FAILED = "Program verification failed";

// The client POSTs immediately after its own RPC confirms the deploy tx, but
// the server reads through a DIFFERENT RPC node — at "confirmed" commitment
// the account can lag there for a moment. One short retry absorbs that window
// (a rejected save is silently dropped client-side, which would later block
// the capstone credential gate for a legitimate deploy).
//
// The retry makes the "missing" path ~1.5s slower than other rejections — a
// timing oracle, but only over account EXISTENCE, which anyone can already
// read for free from any public devnet RPC. Equalizing would add 1.5s to
// every legitimate failure response for no secrecy gain, so we don't.
const MISSING_ACCOUNT_RETRY_DELAY_MS = 1_500;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as SaveDeployRequest;

    if (!body.lessonId || !body.courseId || !body.programId) {
      return NextResponse.json(
        { error: "lessonId, courseId, and programId are required" },
        { status: 400 }
      );
    }

    // Validate programId looks like a base58 Solana address (32-44 chars)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(body.programId)) {
      return NextResponse.json(
        { error: "Invalid program ID format" },
        { status: 400 }
      );
    }

    let programPubkey: PublicKey;
    try {
      programPubkey = new PublicKey(body.programId);
    } catch {
      return NextResponse.json(
        { error: "Invalid program ID format" },
        { status: 400 }
      );
    }

    // Each save costs two RPC reads against the server RPC; a save is a rare
    // event (once per deploy lesson, occasional redeploys), so a tight
    // per-user cap plus a classroom-sized per-IP cap bounds the spend.
    // failClosed: this limiter meters platform-funded RPC reads, so a store
    // error DENIES rather than handing out unmetered requests (same rationale
    // as the AI routes). A save that hits the store blip retries cleanly.
    if (
      await isRateLimited("deploy:save", user.id, {
        maxTokens: 20,
        refillIntervalMs: 3_600_000,
        failClosed: true,
      })
    ) {
      return NextResponse.json(
        { error: "Too many save attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }
    if (
      await isRateLimited("deploy:save:ip", getClientIp(request.headers), {
        maxTokens: 200,
        refillIntervalMs: 3_600_000,
        failClosed: true,
      })
    ) {
      return NextResponse.json(
        { error: "Too many save attempts from this network." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    // The wallet the deploy must be attributed to: the learner's LINKED
    // wallet (profiles.wallet_address), not whatever the request claims. The
    // deploy flow signs with the connected wallet, which becomes the
    // program's upgrade authority — for a legitimate deploy these match.
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("wallet_address")
      .eq("id", user.id)
      .single();

    if (!profile?.wallet_address) {
      // A learner reached the deploy step with no linked wallet — they cannot
      // pass the capstone credential gate until they connect one. Loud so a
      // wave of these near launch is visible, not silent.
      logEvent({
        event: "deploy-save.rejected",
        context: {
          reason: "no-wallet-linked",
          userId: user.id,
          courseId: body.courseId,
          lessonId: body.lessonId,
        },
      });
      return NextResponse.json(
        {
          error: "Wallet not connected. Link your wallet to save deployments.",
        },
        { status: 400 }
      );
    }

    let walletPubkey: PublicKey;
    try {
      walletPubkey = new PublicKey(profile.wallet_address);
    } catch {
      // The stored wallet_address does not parse — a data-integrity fault, not
      // a normal user error. Never silent: it fail-closes a legitimate deploy.
      logEvent({
        event: "deploy-save.rejected",
        level: "error",
        context: {
          reason: "linked-wallet-unparseable",
          userId: user.id,
          courseId: body.courseId,
          lessonId: body.lessonId,
        },
      });
      return NextResponse.json({ error: VERIFICATION_FAILED }, { status: 400 });
    }

    // On-chain verification (#560 / LX-E1): the submitted id must be a live,
    // executable upgradeable program whose upgrade authority is the linked
    // wallet. Without this, any self-reported base58 counts as a deploy and
    // the capstone credential gate (LX-E2) is farmable with someone else's
    // public program id.
    let verification: DeployVerificationResult;
    try {
      const connection = getConnection();
      verification = await verifyProgramDeployment(
        connection,
        programPubkey,
        walletPubkey
      );
      if (!verification.ok && verification.reason === "missing") {
        await new Promise((resolve) =>
          setTimeout(resolve, MISSING_ACCOUNT_RETRY_DELAY_MS)
        );
        verification = await verifyProgramDeployment(
          connection,
          programPubkey,
          walletPubkey
        );
      }
    } catch (err) {
      // RPC unreachable — fail closed, but as "try again", not as a rejection.
      // Loud: a stale/wrong RPC that always throws here would silently block
      // every legitimate deploy (and the capstone credential behind it), and
      // "verification fails closed" is exactly the invisible failure #725 is
      // about.
      logEvent({
        event: "deploy-save.rpc-unavailable",
        level: "error",
        context: {
          userId: user.id,
          courseId: body.courseId,
          lessonId: body.lessonId,
          error: err instanceof Error ? err.message : String(err),
        },
      });
      return NextResponse.json(
        { error: "Verification temporarily unavailable. Please try again." },
        { status: 503, headers: { "Retry-After": "30" } }
      );
    }

    if (!verification.ok) {
      // Structured so a run of a single reason (e.g. authority-mismatch across
      // many users → wrong RPC network) is greppable, without leaking the
      // reason to the client (VERIFICATION_FAILED stays generic — #560).
      logEvent({
        event: "deploy-save.rejected",
        context: {
          reason: `verification:${verification.reason}`,
          userId: user.id,
          courseId: body.courseId,
          lessonId: body.lessonId,
          programId: body.programId,
        },
      });
      return NextResponse.json({ error: VERIFICATION_FAILED }, { status: 400 });
    }

    // Upsert — if user re-deploys to the same lesson, update the program_id.
    // Service-role client on purpose: deployed_programs has NO client
    // INSERT/UPDATE policies (20260726121000_lockdown_deployed_programs_rls),
    // so this verified route is the only write path — a direct devtools
    // insert can't bypass the on-chain check above.
    const { error } = await adminClient.from("deployed_programs").upsert(
      {
        user_id: user.id,
        course_id: body.courseId,
        lesson_id: body.lessonId,
        program_id: body.programId,
        network: "devnet",
        deployed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,course_id,lesson_id" }
    );

    if (error) {
      // The verified deploy could not be recorded — the capstone credential
      // gate reads this exact row, so a swallowed write here is the #725
      // failure mode itself. Loud and structured.
      logEvent({
        event: "deploy-save.write-failed",
        level: "error",
        context: {
          userId: user.id,
          courseId: body.courseId,
          lessonId: body.lessonId,
          programId: body.programId,
          error: error.message,
        },
      });
      return NextResponse.json(
        { error: "Failed to save deployment" },
        { status: 500 }
      );
    }

    // A successful write is the event #725 is waiting on (0 rows in prod, ever)
    // — log it at info so the first real end-to-end run is observable and the
    // funnel's `deploys` count has a per-event breadcrumb.
    logEvent({
      event: "deploy-save.saved",
      level: "info",
      context: {
        userId: user.id,
        courseId: body.courseId,
        lessonId: body.lessonId,
        programId: body.programId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    // Previously an empty `catch {}` — any unexpected throw returned a generic
    // 500 with NO log, making a broken save path completely invisible. Never
    // silent again.
    logEvent({
      event: "deploy-save.unhandled",
      level: "error",
      context: { error: err instanceof Error ? err.message : String(err) },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: check if user has a deployment for a given lesson (or course).
// Query params:
//   - courseId (required) — find deployments for this course
//   - lessonId (optional) — narrow to a specific lesson
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const lessonId = request.nextUrl.searchParams.get("lessonId");
    const courseId = request.nextUrl.searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("deployed_programs")
      .select("program_id, network, deployed_at")
      .eq("user_id", user.id)
      .eq("course_id", courseId);

    if (lessonId) {
      query = query.eq("lesson_id", lessonId);
    }

    const { data } = await query
      .order("deployed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) {
      return NextResponse.json({ deployed: false });
    }

    return NextResponse.json({
      deployed: true,
      programId: data.program_id,
      network: data.network,
      deployedAt: data.deployed_at,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
