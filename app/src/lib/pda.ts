import { PublicKey } from "@solana/web3.js";

// Real devnet program deployed by Superteam Brazil for this bounty
export const PROGRAM_ID = new PublicKey(
    process.env.NEXT_PUBLIC_PROGRAM_ID || "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf"
);

export const TOKEN_2022_PROGRAM_ID = new PublicKey(
    "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

export const MPL_CORE_PROGRAM_ID = new PublicKey(
    "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
);

export const XP_MINT = new PublicKey(
    process.env.NEXT_PUBLIC_XP_MINT ?? "xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3"
);

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

export function getEnrollmentPda(courseId: string, learner: PublicKey): PublicKey {
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
