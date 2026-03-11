import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCourseById } from "@/lib/sanity/queries";
import { issueCredential, getConnection } from "@/lib/solana/academy-program";
import { fetchEnrollment, fetchCourse } from "@/lib/solana/academy-reads";
import { getProgramId } from "@/lib/solana/pda";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

/**
 * Manual certificate minting for completed courses.
 * Used when the automatic webhook chain failed (e.g. missing trackCollectionAddress).
 */
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

    const body = (await request.json()) as { courseId?: unknown };
    if (typeof body.courseId !== "string" || !body.courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }
    const courseId = body.courseId;

    // Get wallet address from profile
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("wallet_address, username")
      .eq("id", user.id)
      .single();

    if (!profile?.wallet_address) {
      return NextResponse.json(
        { error: "No wallet linked to your account" },
        { status: 400 }
      );
    }

    // Check if certificate already exists
    const { data: existingCert } = await adminClient
      .from("certificates")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existingCert) {
      return NextResponse.json(
        { error: "Certificate already minted" },
        { status: 409 }
      );
    }

    const connection = getConnection();
    const learnerPk = new PublicKey(profile.wallet_address);

    // Check enrollment exists and course is completed on-chain
    const enrollment = await fetchEnrollment(
      courseId,
      learnerPk,
      connection,
      getProgramId()
    );
    if (!enrollment) {
      return NextResponse.json(
        { error: "No enrollment found for this course" },
        { status: 400 }
      );
    }
    if (!enrollment.completed_at) {
      return NextResponse.json(
        { error: "Course is not finalized on-chain" },
        { status: 400 }
      );
    }
    if (enrollment.credential_asset) {
      return NextResponse.json(
        { error: "Credential already issued on-chain" },
        { status: 409 }
      );
    }

    // Get course data from Sanity
    const sanityCourse = await getCourseById(courseId);
    if (!sanityCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const trackCollectionAddress = sanityCourse.trackCollectionAddress as
      | string
      | undefined;
    if (!trackCollectionAddress) {
      return NextResponse.json(
        {
          error:
            "Course is missing trackCollectionAddress — ask an admin to sync the course first",
        },
        { status: 400 }
      );
    }

    const trackCollectionPubkey = new PublicKey(trackCollectionAddress);
    const courseName = sanityCourse.title ?? courseId;

    // Truncate credential name to 32 UTF-8 bytes (on-chain limit)
    let credentialName = `Superteam Academy: ${courseName}`;
    const encoder = new TextEncoder();
    while (encoder.encode(credentialName).length > 32) {
      credentialName = credentialName.slice(0, -1);
    }

    // Fetch on-chain course for XP calculation
    const onChainCourse = await fetchCourse(
      courseId,
      connection,
      getProgramId()
    );
    const totalXp = onChainCourse
      ? Number(onChainCourse.xp_per_lesson) *
        (Number(onChainCourse.lesson_count) || 1)
      : 0;

    // Build metadata
    const metadataJson = {
      name: credentialName,
      symbol: "STACAD",
      description: `Certificate of completion for ${courseName} on Superteam Academy.`,
      image: "",
      attributes: [
        { trait_type: "Course", value: courseName },
        {
          trait_type: "Completion Date",
          value: new Date().toISOString().split("T")[0],
        },
        {
          trait_type: "Recipient",
          value: profile.username ?? profile.wallet_address,
        },
        { trait_type: "Platform", value: "Superteam Academy" },
      ],
      properties: { category: "certificate", creators: [] },
      external_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/certificates`,
      seller_fee_basis_points: 0,
    };

    // Store metadata in Supabase
    const { data: metadataRow, error: metaError } = await adminClient
      .from("nft_metadata")
      .insert({ data: metadataJson })
      .select("id")
      .single();

    if (metaError || !metadataRow) {
      return NextResponse.json(
        { error: "Failed to store metadata" },
        { status: 500 }
      );
    }

    const metadataUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/certificates/metadata?id=${metadataRow.id}`;

    // Count how many certificates this user already has (the current one is not yet inserted)
    const { count: existingCertCount } = await adminClient
      .from("certificates")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    let mintSignature: string;
    let mintAddress: PublicKey;
    try {
      const result = await issueCredential(
        courseId,
        learnerPk,
        credentialName,
        metadataUri,
        (existingCertCount ?? 0) + 1,
        totalXp,
        trackCollectionPubkey
      );
      mintSignature = result.signature;
      mintAddress = result.mintAddress;
    } catch (mintErr) {
      // Clean up orphaned metadata row
      await adminClient.from("nft_metadata").delete().eq("id", metadataRow.id);
      logError({
        errorId: ERROR_IDS.CERTIFICATE_INSERT_FAILED,
        error: mintErr instanceof Error ? mintErr : new Error(String(mintErr)),
        context: { handler: "certificates/mint", userId: user.id, courseId },
      });
      return NextResponse.json(
        { error: "On-chain credential minting failed" },
        { status: 500 }
      );
    }

    // Record certificate in DB
    await adminClient.from("certificates").upsert(
      {
        user_id: user.id,
        course_id: courseId,
        course_title: courseName,
        mint_address: mintAddress.toBase58(),
        metadata_uri: metadataUri,
        minted_at: new Date().toISOString(),
        tx_signature: mintSignature,
        credential_type: "core",
      },
      { onConflict: "user_id,course_id" }
    );

    // Resolve any pending_onchain_actions for this certificate
    await adminClient
      .from("pending_onchain_actions")
      .update({ resolved_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("action_type", "certificate")
      .eq("reference_id", courseId);

    return NextResponse.json({
      success: true,
      mintAddress: mintAddress.toBase58(),
      txSignature: mintSignature,
    });
  } catch (err) {
    logError({
      errorId: ERROR_IDS.CERTIFICATE_INSERT_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { handler: "certificates/mint" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
