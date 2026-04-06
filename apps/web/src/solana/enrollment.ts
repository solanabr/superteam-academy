import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
} from "@solana/web3.js";
import {
    DEVNET_RPC_URL,
    PROGRAM_ID,
    getCoursePda,
    getEnrollmentPda,
} from "./program";

interface EnrollParams {
    courseId: string;
    learnerWallet: PublicKey;
    prerequisiteCourseId?: string;
    sendTransaction: (
        tx: Transaction,
        connection: Connection
    ) => Promise<string>;
}

/**
 * Creates an enrollment transaction for the learner to sign.
 * This is a direct wallet-signed transaction (no backend needed).
 */
export async function enrollInCourse({
    courseId,
    learnerWallet,
    prerequisiteCourseId,
    sendTransaction,
}: EnrollParams): Promise<string> {
    const connection = new Connection(DEVNET_RPC_URL, "confirmed");
    const coursePda = getCoursePda(courseId);
    const enrollmentPda = getEnrollmentPda(courseId, learnerWallet);

    // Build the instruction data manually
    // Anchor discriminator for "enroll" = sha256("global:enroll")[0..8]
    const discriminator = Buffer.from([
        0x2a, 0x59, 0x54, 0xc5, 0x7c, 0x85, 0x7a, 0x7e,
    ]);
    const courseIdBytes = Buffer.from(courseId);
    const courseIdLen = Buffer.alloc(4);
    courseIdLen.writeUInt32LE(courseIdBytes.length);

    const data = Buffer.concat([discriminator, courseIdLen, courseIdBytes]);

    const keys = [
        { pubkey: coursePda, isSigner: false, isWritable: false },
        { pubkey: enrollmentPda, isSigner: false, isWritable: true },
        { pubkey: learnerWallet, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ];

    // Add prerequisite accounts if needed
    if (prerequisiteCourseId) {
        const prereqCoursePda = getCoursePda(prerequisiteCourseId);
        const prereqEnrollmentPda = getEnrollmentPda(
            prerequisiteCourseId,
            learnerWallet
        );
        keys.push(
            { pubkey: prereqCoursePda, isSigner: false, isWritable: false },
            { pubkey: prereqEnrollmentPda, isSigner: false, isWritable: false }
        );
    }

    const tx = new Transaction().add({
        programId: PROGRAM_ID,
        keys,
        data,
    });

    tx.feePayer = learnerWallet;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const signature = await sendTransaction(tx, connection);
    await connection.confirmTransaction(signature, "confirmed");

    return signature;
}

/**
 * Check if a learner is enrolled in a course by checking for the Enrollment PDA.
 */
export async function checkEnrollment(
    courseId: string,
    learnerWallet: PublicKey
): Promise<boolean> {
    try {
        const connection = new Connection(DEVNET_RPC_URL, "confirmed");
        const enrollmentPda = getEnrollmentPda(courseId, learnerWallet);
        const info = await connection.getAccountInfo(enrollmentPda);
        return info !== null;
    } catch {
        return false;
    }
}
