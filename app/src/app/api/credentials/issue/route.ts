import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/credentials/issue
 *
 * Backend-signed stub for issue_credential instruction.
 * In production:
 * 1. Verifies course is finalized
 * 2. Generates credential asset keypair
 * 3. Builds issue_credential CPI to Metaplex Core
 * 4. Signs with backend keypair + credential asset keypair
 *
 * Request body:
 *   { courseId: string, learnerWallet: string, credentialName: string, metadataUri: string }
 *
 * Response:
 *   { signature: string, credentialAddress: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, learnerWallet, credentialName } = body;

    if (!courseId || !learnerWallet) {
      return NextResponse.json(
        { error: "Missing required fields: courseId, learnerWallet" },
        { status: 400 }
      );
    }

    const stubSignature = `stub_cred_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const stubCredentialAddress = `cred_${Math.random().toString(36).slice(2, 14)}`;

    return NextResponse.json({
      signature: stubSignature,
      credentialAddress: stubCredentialAddress,
      credentialName: credentialName || `${courseId} Credential`,
      courseId,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
