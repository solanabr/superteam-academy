import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { courseId, learnerWallet } = await req.json();

        if (!courseId || !learnerWallet) {
            return NextResponse.json({ error: "Missing params" }, { status: 400 });
        }

        // TODO: Verify all lessons complete via bitmap read
        // TODO: Sign finalize_course with backend keypair
        // TODO: Sign issue_credential or upgrade_credential depending on enrollment.credential_asset

        return NextResponse.json({
            success: true,
            txSignature: "demo_finalize_" + Date.now(),
            credentialMinted: true,
        });
    } catch (err) {
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
