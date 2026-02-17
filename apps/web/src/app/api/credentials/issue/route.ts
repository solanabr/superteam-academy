import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import {
  issueCredential as onChainIssueCredential,
  getConnection,
  PROGRAM_ID,
} from "@/lib/solana/academy-program";
import { fetchEnrollment, fetchCourse } from "@/lib/solana/academy-reads";
import { getCourseBySlug } from "@/lib/sanity/queries";

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

    const supabaseAdmin = createAdminClient();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("wallet_address, username")
      .eq("id", user.id)
      .single();

    if (!profile?.wallet_address) {
      return NextResponse.json(
        { error: "Wallet not connected" },
        { status: 400 }
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

    // Generate metadata
    const sanityCourse = await getCourseBySlug(courseId);
    const courseName = sanityCourse?.title ?? courseId;

    const metadataJson = {
      name: `Superteam Academy: ${courseName}`.slice(0, 32),
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

    // Fetch course data for credential attributes
    const course = await fetchCourse(courseId, connection, PROGRAM_ID);

    const { signature, mintAddress } = await onChainIssueCredential(
      courseId,
      walletPubkey,
      `Superteam Academy: ${courseName}`.slice(0, 32),
      metadataUri,
      1,
      course?.xpPerLesson
        ? (course.xpPerLesson as number) *
            ((course?.lessonCount as number) ?? 1)
        : 0,
      new PublicKey(trackCollection)
    );

    // Supabase mirror
    await supabaseAdmin.from("certificates").insert({
      user_id: user.id,
      course_id: courseId,
      mint_address: mintAddress.toBase58(),
      metadata_uri: metadataUri,
      minted_at: new Date().toISOString(),
      tx_signature: signature,
      credential_type: "core",
    });

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
