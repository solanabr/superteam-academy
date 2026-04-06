import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
    "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf"
);
export const TOKEN_2022_PROGRAM_ID = new PublicKey(
    "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);
export const MPL_CORE_PROGRAM_ID = new PublicKey(
    "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
);

export const HELIUS_RPC_URL =
    process.env.NEXT_PUBLIC_HELIUS_RPC_URL ??
    "https://devnet.helius-rpc.com/?api-key=demo";

export const DEVNET_RPC_URL =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
    "https://api.devnet.solana.com";

/* ── PDA Derivation ───────────────────────── */

export function getConfigPda(): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        PROGRAM_ID
    );
    return pda;
}

export function getCoursePda(courseId: string): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("course"), Buffer.from(courseId)],
        PROGRAM_ID
    );
    return pda;
}

export function getEnrollmentPda(
    courseId: string,
    learner: PublicKey
): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
        PROGRAM_ID
    );
    return pda;
}

export function getMinterRolePda(minter: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("minter"), minter.toBuffer()],
        PROGRAM_ID
    );
    return pda;
}

export function getAchievementTypePda(achievementId: string): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("achievement"), Buffer.from(achievementId)],
        PROGRAM_ID
    );
    return pda;
}

export function getAchievementReceiptPda(
    achievementId: string,
    recipient: PublicKey
): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("achievement_receipt"),
            Buffer.from(achievementId),
            recipient.toBuffer(),
        ],
        PROGRAM_ID
    );
    return pda;
}

/* ── Level derivation ─────────────────────── */

export function deriveLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100));
}

/* ── Bitmap helpers ───────────────────────── */

export function isLessonComplete(
    lessonFlags: bigint[],
    lessonIndex: number
): boolean {
    const wordIndex = Math.floor(lessonIndex / 64);
    const bitIndex = lessonIndex % 64;
    if (wordIndex >= lessonFlags.length) return false;
    return (lessonFlags[wordIndex] & (1n << BigInt(bitIndex))) !== 0n;
}

export function countCompletedLessons(lessonFlags: bigint[]): number {
    let count = 0;
    for (const word of lessonFlags) {
        let w = word;
        while (w > 0n) {
            count += Number(w & 1n);
            w >>= 1n;
        }
    }
    return count;
}

export function getCompletedLessonIndices(
    lessonFlags: bigint[],
    lessonCount: number
): number[] {
    const indices: number[] = [];
    for (let i = 0; i < lessonCount; i++) {
        if (isLessonComplete(lessonFlags, i)) indices.push(i);
    }
    return indices;
}
