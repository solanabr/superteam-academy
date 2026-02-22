import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl("devnet"),
);

const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "11111111111111111111111111111111",
);

const XP_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_XP_MINT ?? "11111111111111111111111111111111",
);

// --- PDA Helpers ---

export function getConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
}

export function getCoursePDA(courseId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(courseId)],
    PROGRAM_ID,
  );
}

export function getEnrollmentPDA(
  courseId: string,
  user: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), user.toBuffer()],
    PROGRAM_ID,
  );
}

export function getMinterRolePDA(minter: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("minter"), minter.toBuffer()],
    PROGRAM_ID,
  );
}

export function getAchievementTypePDA(achievementId: number): [PublicKey, number] {
  const buf = Buffer.alloc(2);
  buf.writeUInt16LE(achievementId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("achievement"), buf],
    PROGRAM_ID,
  );
}

export function getCredentialPDA(
  learner: PublicKey,
  trackId: number,
): [PublicKey, number] {
  const buf = Buffer.alloc(2);
  buf.writeUInt16LE(trackId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("credential"), learner.toBuffer(), buf],
    PROGRAM_ID,
  );
}

// --- Balance Helpers ---

export async function getSOLBalance(address: PublicKey): Promise<number> {
  const balance = await connection.getBalance(address);
  return balance / 1e9;
}

export async function getXPBalance(owner: PublicKey): Promise<number> {
  try {
    const { TOKEN_2022_PROGRAM_ID } = await import("@solana/spl-token");
    const { getAssociatedTokenAddressSync } = await import("@solana/spl-token");

    const ata = getAssociatedTokenAddressSync(
      XP_MINT,
      owner,
      true,
      TOKEN_2022_PROGRAM_ID,
    );

    const accountInfo = await connection.getAccountInfo(ata, "confirmed");
    if (!accountInfo) return 0;

    // Token account data: mint (32) + owner (32) + amount (8 bytes LE at offset 64)
    const amount = accountInfo.data.readBigUInt64LE(64);
    return Number(amount);
  } catch {
    return 0;
  }
}

export { connection, PROGRAM_ID, XP_MINT };
