import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl("devnet"),
);

const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "11111111111111111111111111111111",
);

export function getConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
}

export function getLearnerPDA(user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("learner"), user.toBuffer()],
    PROGRAM_ID,
  );
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

export async function getSOLBalance(address: PublicKey): Promise<number> {
  const balance = await connection.getBalance(address);
  return balance / 1e9;
}

export { connection, PROGRAM_ID };
