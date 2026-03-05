import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Idl, BN } from "@coral-xyz/anchor";
import IDL from "@/lib/idl/onchain_academy.json";

// ─── Program IDs from env ────────────────────────────────────────────
export const PROGRAM_ID = new PublicKey(
    process.env.NEXT_PUBLIC_PROGRAM_ID || "6HnycmCPR4YJpTcHcCHh11fkVaxshaU7jfsygMoVt7uK"
);
export const XP_MINT = new PublicKey(
    process.env.NEXT_PUBLIC_XP_MINT || "8RAZmioKhG2piAdgKXMMDBeDMsvVNCXoFJUNEkhAgtt5"
);
export const PROGRAM_AUTHORITY = new PublicKey(
    process.env.NEXT_PUBLIC_PROGRAM_AUTHORITY || "CqBXAZP13A6NeEA84ZtsCTjkDERUm7BqFE2zCrLuGcey"
);
export const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
export const MPL_CORE_PROGRAM_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

// ─── Connection ──────────────────────────────────────────────────────
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";

let _connection: Connection | null = null;
export function getConnection(): Connection {
    if (!_connection) {
        _connection = new Connection(RPC_URL, "confirmed");
    }
    return _connection;
}

// ─── Read-only Program (no wallet needed for queries) ────────────────
let _readOnlyProgram: Program | null = null;
export function getReadOnlyProgram(): Program {
    if (!_readOnlyProgram) {
        const connection = getConnection();
        // A read-only provider for fetching accounts (no wallet signing)
        const readOnlyProvider = {
            connection,
            publicKey: null,
        } as unknown as AnchorProvider;
        _readOnlyProgram = new Program(IDL as Idl, readOnlyProvider);
    }
    return _readOnlyProgram;
}

// ─── Program with wallet (for signing txs) ───────────────────────────
export function getProgramWithProvider(provider: AnchorProvider): Program {
    return new Program(IDL as Idl, provider);
}

// ─── PDA Derivation Helpers ──────────────────────────────────────────

export function getConfigPda(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        PROGRAM_ID
    );
}

export function getCoursePda(courseId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("course"), Buffer.from(courseId)],
        PROGRAM_ID
    );
}

export function getEnrollmentPda(courseId: string, learner: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
        PROGRAM_ID
    );
}

export function getMinterPda(minter: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("minter"), minter.toBuffer()],
        PROGRAM_ID
    );
}

export function getAchievementTypePda(achievementId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("achievement"), Buffer.from(achievementId)],
        PROGRAM_ID
    );
}

export function getAchievementReceiptPda(achievementId: string, recipient: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("achievement_receipt"), Buffer.from(achievementId), recipient.toBuffer()],
        PROGRAM_ID
    );
}

// ─── Token-2022 ATA Helper ──────────────────────────────────────────
export function getAssociatedTokenAddressToken2022(
    mint: PublicKey,
    owner: PublicKey
): PublicKey {
    const [ata] = PublicKey.findProgramAddressSync(
        [
            owner.toBuffer(),
            TOKEN_2022_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
        ],
        new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL") // Associated Token Program
    );
    return ata;
}

// ─── Bitmap Helpers ─────────────────────────────────────────────────
/** Decode lesson_flags (4 × u64 = 256-bit bitmap) into array of completed lesson indices */
export function decodeLessonBitmap(lessonFlags: BN[]): number[] {
    const completed: number[] = [];
    for (let wordIdx = 0; wordIdx < lessonFlags.length; wordIdx++) {
        const word = lessonFlags[wordIdx];
        for (let bit = 0; bit < 64; bit++) {
            const idx = wordIdx * 64 + bit;
            if (word.shrn(bit).and(new BN(1)).toNumber() === 1) {
                completed.push(idx);
            }
        }
    }
    return completed;
}
