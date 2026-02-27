/**
 * Reward XP API Route
 * Minter-signed transaction for awarding arbitrary XP to recipients
 *
 * POST /api/xp/reward
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  PROGRAM_ID,
  XP_MINT,
  TOKEN_2022_PROGRAM_ID,
  RPC_ENDPOINTS,
  NETWORK,
} from '@/lib/solana/program-config';
import { deriveConfigPda, deriveMinterRolePda, deriveXpTokenAccount } from '@/lib/solana/pda';
import { auth } from '@/lib/auth';
import { BN } from '@coral-xyz/anchor';

// Instruction discriminator for reward_xp
const REWARD_XP_DISCRIMINATOR = Buffer.from([0x67, 0x89, 0xab, 0xcd, 0xef, 0x01, 0x23, 0x45]);

interface RewardXpRequest {
  recipientWallet: string;
  amount: number;
  reason?: string;
}

interface RewardXpResponse {
  success: boolean;
  signature?: string;
  amount?: number;
  recipient?: string;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<RewardXpResponse>> {
  try {
    // Check authentication (admin/minter only)
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const body: RewardXpRequest = await req.json();
    const { recipientWallet, amount, reason } = body;

    if (!recipientWallet || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: recipientWallet, amount' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than zero' },
        { status: 400 }
      );
    }

    const recipient = new PublicKey(recipientWallet);

    // Get backend signer (acts as minter)
    const backendSignerSecret = process.env.BACKEND_SIGNER_SECRET_KEY;
    if (!backendSignerSecret) {
      console.error('BACKEND_SIGNER_SECRET_KEY not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const minterSigner = Keypair.fromSecretKey(Buffer.from(JSON.parse(backendSignerSecret)));

    // Get connection
    const rpcUrl = RPC_ENDPOINTS[NETWORK as keyof typeof RPC_ENDPOINTS];
    const connection = new Connection(rpcUrl, 'confirmed');

    // Derive PDAs
    const [configPda] = deriveConfigPda();
    const [minterRolePda] = deriveMinterRolePda(minterSigner.publicKey);

    // Get recipient's XP token account
    const recipientXpAta = deriveXpTokenAccount(recipient, XP_MINT);

    // Build reward_xp instruction
    // Args: amount (u64), reason (string - optional, for logging)
    const amountBn = new BN(amount);
    const reasonBytes = Buffer.from(reason || '', 'utf-8');

    const argsBuffer = Buffer.alloc(8 + 4 + reasonBytes.length);
    let offset = 0;

    // Write amount (u64)
    amountBn.toArrayLike(Buffer, 'le', 8).copy(argsBuffer, offset);
    offset += 8;

    // Write reason string (length-prefixed)
    argsBuffer.writeUInt32LE(reasonBytes.length, offset);
    offset += 4;
    reasonBytes.copy(argsBuffer, offset);

    const instructionData = Buffer.concat([REWARD_XP_DISCRIMINATOR, argsBuffer]);

    // Build instruction
    const instruction = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: configPda, isSigner: false, isWritable: false },
        { pubkey: minterRolePda, isSigner: false, isWritable: true },
        { pubkey: XP_MINT, isSigner: false, isWritable: true },
        { pubkey: recipientXpAta, isSigner: false, isWritable: true },
        { pubkey: minterSigner.publicKey, isSigner: true, isWritable: false },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      data: instructionData,
    });

    // Build and send transaction
    const transaction = new Transaction().add(instruction);
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = minterSigner.publicKey;

    const signature = await sendAndConfirmTransaction(connection, transaction, [minterSigner], {
      commitment: 'confirmed',
    });

    return NextResponse.json({
      success: true,
      signature,
      amount,
      recipient: recipientWallet,
    });
  } catch (error) {
    console.error('Error rewarding XP:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to reward XP';

    if (errorMessage.includes('MinterNotActive')) {
      return NextResponse.json(
        { success: false, error: 'Minter role is not active' },
        { status: 403 }
      );
    }

    if (errorMessage.includes('MinterAmountExceeded')) {
      return NextResponse.json(
        { success: false, error: 'Amount exceeds minter per-call limit' },
        { status: 400 }
      );
    }

    if (errorMessage.includes('InvalidAmount')) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
