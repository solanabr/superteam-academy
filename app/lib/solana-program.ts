import { Connection, PublicKey } from '@solana/web3.js';

// On-chain program deployed to Solana devnet
// Source of truth: onchain-academy/Anchor.toml → programs.devnet.onchain_academy
export const PROGRAM_ID = new PublicKey(
  'ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf'
);

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_ENDPOINT ?? 'https://api.devnet.solana.com';

export function getConnection(): Connection {
  return new Connection(RPC_ENDPOINT, 'confirmed');
}

export function getConfigPDA(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    PROGRAM_ID
  );
  return pda;
}

export function getCoursePDA(courseId: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('course'), Buffer.from(courseId)],
    PROGRAM_ID
  );
  return pda;
}

export function getEnrollmentPDA(
  courseId: string,
  userPubkey: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('enrollment'), Buffer.from(courseId), userPubkey.toBytes()],
    PROGRAM_ID
  );
  return pda;
}

export function getProgressPDA(
  courseId: string,
  userPubkey: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('progress'), Buffer.from(courseId), userPubkey.toBytes()],
    PROGRAM_ID
  );
  return pda;
}

export function getCredentialPDA(
  courseId: string,
  userPubkey: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('credential'), Buffer.from(courseId), userPubkey.toBytes()],
    PROGRAM_ID
  );
  return pda;
}

export function getLearnerProfilePDA(userPubkey: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('learner'), userPubkey.toBytes()],
    PROGRAM_ID
  );
  return pda;
}

export function explorerUrl(
  signature: string,
  cluster: 'devnet' | 'mainnet-beta' = 'devnet'
): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
