import { NextRequest, NextResponse } from "next/server";

// Backend signs lesson completion after validation
// In production: validate user content completion, then sign with backend keypair
export async function POST(req: NextRequest) {
    try {
        const { courseId, lessonIndex, learnerWallet } = await req.json();

        if (!courseId || lessonIndex === undefined || !learnerWallet) {
            return NextResponse.json({ error: "Missing params" }, { status: 400 });
        }

        // TODO: Validate lesson completion server-side (quiz/challenge check)
        // TODO: Load backend signer from env: JSON.parse(process.env.BACKEND_SIGNER_PRIVATE_KEY!)
        // TODO: Build & send complete_lesson instruction via Anchor

        // Simulated response for demo
        return NextResponse.json({
            success: true,
            txSignature: "demo_tx_" + Date.now(),
            xpAwarded: 100,
            lessonIndex,
        });
    } catch (err) {
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
