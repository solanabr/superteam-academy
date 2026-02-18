import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import {
  issueCredential as onChainIssueCredential,
  getConnection,
  isOnChainProgramLive,
  PROGRAM_ID,
} from "@/lib/solana/academy-program";
import { fetchEnrollment, fetchCourse } from "@/lib/solana/academy-reads";
import { getCourseById } from "@/lib/sanity/queries";

interface IssueCredentialRequest {
  courseId: string;
  trackCollection: string; // base58 pubkey of the Metaplex Core collection
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

    const body = (await request.json()) as IssueCredentialRequest;
    const { courseId, trackCollection } = body;

    if (!courseId || !trackCollection) {
      return NextResponse.json(
        { error: "Missing courseId or trackCollection" },
        { status: 400 }
      );
    }

    // Validate trackCollection is a valid base58 public key
    let trackCollectionPubkey: PublicKey;
    try {
      trackCollectionPubkey = new PublicKey(trackCollection);
    } catch {
      return NextResponse.json(
        { error: "Invalid trackCollection address" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("wallet_address, username")
      .eq("id", user.id)
      .single();

    if (profileError) {
      logError({
        errorId: ERROR_IDS.CREDENTIAL_ISSUE_FAILED,
        error: new Error(profileError.message),
        context: {
          route: "/api/credentials/issue",
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

    if (!(await isOnChainProgramLive())) {
      return NextResponse.json(
        { error: "On-chain program not available" },
        { status: 503 }
      );
    }

    const walletPubkey = new PublicKey(profile.wallet_address);
    const connection = getConnection();

    // Verify enrollment is finalized and no credential already issued
    const enrollment = await fetchEnrollment(
      courseId,
      walletPubkey,
      connection,
      PROGRAM_ID
    );

    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    }

    if (!enrollment.completedAt) {
      return NextResponse.json(
        { error: "Course not finalized" },
        { status: 400 }
      );
    }

    if (enrollment.credentialAsset) {
      return NextResponse.json(
        { error: "Credential already issued" },
        { status: 400 }
      );
    }

    // Fetch course data for credential attributes (before metadata insert)
    const course = await fetchCourse(courseId, connection, PROGRAM_ID);
    if (!course) {
      return NextResponse.json(
        { error: "Course not found on-chain" },
        { status: 404 }
      );
    }

    // Generate metadata
    const sanityCourse = await getCourseById(courseId);
    const courseName = sanityCourse?.title ?? courseId;
    // Truncate by UTF-8 byte length (on-chain max_len = 32 bytes)
    let credentialName = `Superteam Academy: ${courseName}`;
    const encoder = new TextEncoder();
    while (encoder.encode(credentialName).length > 32) {
      credentialName = credentialName.slice(0, -1);
    }
    const totalXp =
      (course.xpPerLesson as number) * ((course.lessonCount as number) ?? 1);

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

    // Store metadata in Supabase (nft_metadata table has public read, authenticated insert)
    const { data: metadataRow, error: metaError } = await supabaseAdmin
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

    let signature: string;
    let mintAddress: PublicKey;
    try {
      const result = await onChainIssueCredential(
        courseId,
        walletPubkey,
        credentialName,
        metadataUri,
        1,
        totalXp,
        trackCollectionPubkey
      );
      signature = result.signature;
      mintAddress = result.mintAddress;
    } catch (err) {
      // Clean up orphaned metadata row
      await supabaseAdmin
        .from("nft_metadata")
        .delete()
        .eq("id", metadataRow.id);
      throw err;
    }

    // Supabase mirror
    const { error: certInsertError } = await supabaseAdmin
      .from("certificates")
      .insert({
        user_id: user.id,
        course_id: courseId,
        course_title: courseName,
        mint_address: mintAddress.toBase58(),
        metadata_uri: metadataUri,
        minted_at: new Date().toISOString(),
        tx_signature: signature,
        credential_type: "core",
      });

    if (certInsertError) {
      logError({
        errorId: ERROR_IDS.CREDENTIAL_ISSUE_FAILED,
        error: new Error(certInsertError.message),
        context: {
          route: "/api/credentials/issue",
          note: "On-chain credential minted but Supabase insert failed",
          mintAddress: mintAddress.toBase58(),
          signature,
        },
      });
    }

    return NextResponse.json({
      success: true,
      signature,
      mintAddress: mintAddress.toBase58(),
      metadataUri,
    });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.CREDENTIAL_ISSUE_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/credentials/issue" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
