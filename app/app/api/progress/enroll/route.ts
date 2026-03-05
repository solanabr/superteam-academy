import { NextRequest, NextResponse } from "next/server";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
    getConnection,
    getCoursePda,
    getEnrollmentPda,
    PROGRAM_ID,
} from "@/lib/anchor-client";

/**
 * Enrollment is signed client-side (learner's wallet signs).
 * This route just returns the serialized transaction for the client to sign.
 * However, since the `enroll` instruction only requires the learner signer,
 * and we're using wallet-adapter on the client, we return the account addresses
 * the client needs to build the instruction.
 */
export async function POST(request: NextRequest) {
    try {
        const { courseId, learnerWallet } = await request.json();

        if (!courseId || !learnerWallet) {
            return NextResponse.json(
                { error: "Missing courseId or learnerWallet" },
                { status: 400 }
            );
        }

        const learner = new PublicKey(learnerWallet);
        const [coursePda] = getCoursePda(courseId);
        const [enrollmentPda] = getEnrollmentPda(courseId, learner);

        // Verify the course exists on-chain
        const connection = getConnection();
        const courseAccount = await connection.getAccountInfo(coursePda);

        if (!courseAccount) {
            // Course not on-chain yet — allow enrollment anyway (local-only mode)
            return NextResponse.json({
                success: true,
                onChain: false,
                message: "Course not found on-chain. Enrollment stored locally.",
            });
        }

        // Return the accounts needed for the client to build the enroll instruction
        return NextResponse.json({
            success: true,
            onChain: true,
            accounts: {
                course: coursePda.toBase58(),
                enrollment: enrollmentPda.toBase58(),
                learner: learner.toBase58(),
                systemProgram: SystemProgram.programId.toBase58(),
            },
            courseId,
        });
    } catch (error: any) {
        console.error("enroll error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process enrollment" },
            { status: 500 }
        );
    }
}
