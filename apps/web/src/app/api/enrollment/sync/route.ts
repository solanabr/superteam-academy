import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import { findEnrollmentPDA, PROGRAM_ID } from "@/lib/solana/pda";
import { queueFailedOnchainAction } from "@/lib/solana/onchain-queue";

interface SyncRequest {
  courseId: string;
  txSignature: string;
  action: "enroll" | "close";
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as SyncRequest;
    const { courseId, txSignature, action } = body;

    if (!courseId || !txSignature || !action) {
      return NextResponse.json(
        { error: "Missing courseId, txSignature, or action" },
        { status: 400 }
      );
    }

    if (action !== "enroll" && action !== "close") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (Buffer.byteLength(courseId, "utf8") > 32) {
      return NextResponse.json(
        { error: "courseId exceeds 32 bytes" },
        { status: 400 }
      );
    }

    if (txSignature.length > 88) {
      return NextResponse.json(
        { error: "Invalid transaction signature" },
        { status: 400 }
      );
    }

    // Look up user's wallet
    const supabaseAdmin = createAdminClient();
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("wallet_address")
      .eq("id", user.id)
      .single();

    if (profileError) {
      logError({
        errorId: ERROR_IDS.ENROLLMENT_SYNC_FAILED,
        error: new Error(profileError.message),
        context: {
          route: "/api/enrollment/sync",
          note: "profile lookup failed",
        },
      });
      return NextResponse.json(
        { error: "Failed to look up profile" },
        { status: 500 }
      );
    }

    if (!profile?.wallet_address) {
      return NextResponse.json(
        { error: "Wallet not connected" },
        { status: 400 }
      );
    }

    const walletPubkey = new PublicKey(profile.wallet_address);

    // Verify the transaction on-chain
    const rpcUrl =
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
    const connection = new Connection(rpcUrl, "confirmed");

    const tx = await connection.getTransaction(txSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 400 }
      );
    }

    if (tx.meta?.err) {
      return NextResponse.json(
        { error: "Transaction failed on-chain" },
        { status: 400 }
      );
    }

    // Resolve all account keys including ALT-loaded accounts (versioned txs)
    const accountKeys = tx.transaction.message.getAccountKeys({
      accountKeysFromLookups: tx.meta?.loadedAddresses,
    });

    // Verify program ID is in the transaction
    let hasProgramId = false;
    for (let i = 0; i < accountKeys.length; i++) {
      if (accountKeys.get(i)?.equals(PROGRAM_ID)) {
        hasProgramId = true;
        break;
      }
    }
    if (!hasProgramId) {
      return NextResponse.json(
        { error: "Transaction does not involve the academy program" },
        { status: 400 }
      );
    }

    // Verify the expected enrollment PDA is in the accounts
    const [expectedPDA] = findEnrollmentPDA(courseId, walletPubkey, PROGRAM_ID);
    let hasEnrollmentPDA = false;
    for (let i = 0; i < accountKeys.length; i++) {
      if (accountKeys.get(i)?.equals(expectedPDA)) {
        hasEnrollmentPDA = true;
        break;
      }
    }
    if (!hasEnrollmentPDA) {
      return NextResponse.json(
        { error: "Enrollment PDA mismatch" },
        { status: 400 }
      );
    }

    if (action === "enroll") {
      const { error: upsertError } = await supabaseAdmin
        .from("enrollments")
        .upsert(
          {
            user_id: user.id,
            course_id: courseId,
            enrolled_at: new Date().toISOString(),
            tx_signature: txSignature,
            wallet_address: profile.wallet_address,
          },
          { onConflict: "user_id,course_id" }
        );

      if (upsertError) {
        logError({
          errorId: ERROR_IDS.ENROLLMENT_SYNC_FAILED,
          error: new Error(upsertError.message),
          context: { route: "/api/enrollment/sync", action: "enroll" },
        });
        // On-chain tx succeeded but DB sync failed — queue for automatic retry on next login.
        await queueFailedOnchainAction(
          user.id,
          "enroll",
          courseId,
          {
            courseId,
            txSignature,
            walletAddress: profile.wallet_address,
            enrolledAt: new Date().toISOString(),
          },
          upsertError.message
        );
        return NextResponse.json(
          { error: "Failed to sync enrollment" },
          { status: 500 }
        );
      }
    } else if (action === "close") {
      const { error: deleteError } = await supabaseAdmin
        .from("enrollments")
        .delete()
        .eq("user_id", user.id)
        .eq("course_id", courseId);

      if (deleteError) {
        logError({
          errorId: ERROR_IDS.ENROLLMENT_SYNC_FAILED,
          error: new Error(deleteError.message),
          context: { route: "/api/enrollment/sync", action: "close" },
        });
        return NextResponse.json(
          { error: "Failed to sync enrollment removal" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.ENROLLMENT_SYNC_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/enrollment/sync" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
