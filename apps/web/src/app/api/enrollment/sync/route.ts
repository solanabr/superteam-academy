import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import { findEnrollmentPDA, PROGRAM_ID } from "@/lib/solana/pda";

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

    // Look up user's wallet
    const supabaseAdmin = createAdminClient();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("wallet_address")
      .eq("id", user.id)
      .single();

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

    // Verify program ID is in the transaction
    const accountKeys = tx.transaction.message.getAccountKeys();
    const programIdx = accountKeys.staticAccountKeys.findIndex((k) =>
      k.equals(PROGRAM_ID)
    );
    if (programIdx === -1) {
      return NextResponse.json(
        { error: "Transaction does not involve the academy program" },
        { status: 400 }
      );
    }

    // Verify the expected enrollment PDA is in the accounts
    const [expectedPDA] = findEnrollmentPDA(courseId, walletPubkey, PROGRAM_ID);
    const hasEnrollmentPDA = accountKeys.staticAccountKeys.some((k) =>
      k.equals(expectedPDA)
    );
    if (!hasEnrollmentPDA) {
      return NextResponse.json(
        { error: "Enrollment PDA mismatch" },
        { status: 400 }
      );
    }

    if (action === "enroll") {
      await supabaseAdmin.from("enrollments").upsert(
        {
          user_id: user.id,
          course_id: courseId,
          enrolled_at: new Date().toISOString(),
          tx_signature: txSignature,
          wallet_address: profile.wallet_address,
        },
        { onConflict: "user_id,course_id" }
      );
    } else if (action === "close") {
      await supabaseAdmin
        .from("enrollments")
        .delete()
        .eq("user_id", user.id)
        .eq("course_id", courseId);
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
