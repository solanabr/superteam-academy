import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  ACADEMY_PROGRAM_ID,
  ACADEMY_RPC_URL,
} from "@/lib/generated/academy-program";

const INIT_LEARNER_DISCRIMINATOR = Buffer.from([
  137, 243, 85, 146, 80, 49, 210, 152,
]);

export function deriveLearnerPda(walletAddress: string): PublicKey {
  const wallet = new PublicKey(walletAddress);
  const programId = new PublicKey(ACADEMY_PROGRAM_ID);
  const [learnerPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("learner"), wallet.toBuffer()],
    programId,
  );
  return learnerPda;
}

export function createInitLearnerTransaction(
  walletAddress: string,
): Transaction {
  const user = new PublicKey(walletAddress);
  const programId = new PublicKey(ACADEMY_PROGRAM_ID);
  const learnerPda = deriveLearnerPda(walletAddress);

  const instruction = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: learnerPda, isSigner: false, isWritable: true },
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: INIT_LEARNER_DISCRIMINATOR,
  });

  const tx = new Transaction();
  tx.add(instruction);
  tx.feePayer = user;
  return tx;
}

export async function sendInitLearner(
  sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>,
  walletAddress: string,
): Promise<string> {
  const connection = new Connection(ACADEMY_RPC_URL, "confirmed");
  const tx = createInitLearnerTransaction(walletAddress);
  const signature = await sendTransaction(tx, connection);
  await connection.confirmTransaction(signature, "confirmed");
  return signature;
}
