/**
 * Achievement Award API Route
 * Minter-signed transaction for awarding achievement NFTs and XP
 *
 * POST /api/achievements/award
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  SystemProgram,
} from '@solana/web3.js';
import {
  PROGRAM_ID,
  XP_MINT,
  TOKEN_2022_PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
  RPC_ENDPOINTS,
  NETWORK,
} from '@/lib/solana/program-config';
import {
  deriveConfigPda,
  deriveMinterRolePda,
  deriveAchievementTypePda,
  deriveAchievementReceiptPda,
  deriveXpTokenAccount,
} from '@/lib/solana/pda';
import { auth } from '@/lib/auth';

// Instruction discriminator for award_achievement
const AWARD_ACHIEVEMENT_DISCRIMINATOR = Buffer.from([
  0x89, 0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78,
]);

interface AwardAchievementRequest {
  achievementId: string;
  recipientWallet: string;
}

interface AwardAchievementResponse {
  success: boolean;
  signature?: string;
  achievementAsset?: string;
  achievementId?: string;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<AwardAchievementResponse>> {
  try {
    // Check authentication (admin/minter only)
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const body: AwardAchievementRequest = await req.json();
    const { achievementId, recipientWallet } = body;

    if (!achievementId || !recipientWallet) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: achievementId, recipientWallet' },
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
    const [achievementTypePda] = deriveAchievementTypePda(achievementId);
    const [achievementReceiptPda] = deriveAchievementReceiptPda(achievementId, recipient);

    // Generate new asset keypair for the achievement NFT
    const assetKeypair = Keypair.generate();

    // Get recipient's XP token account
    const recipientXpAta = deriveXpTokenAccount(recipient, XP_MINT);

    // Fetch achievement type to get collection address
    // For now, we'll use a placeholder - in production, fetch from achievementType account
    const achievementTypeInfo = await connection.getAccountInfo(achievementTypePda);
    if (!achievementTypeInfo) {
      return NextResponse.json(
        { success: false, error: 'Achievement type not found' },
        { status: 404 }
      );
    }

    // Parse collection address from achievement type account
    // Offset depends on account structure - collection is after discriminator + id + name + uri
    const data = achievementTypeInfo.data;
    // Skip discriminator (8) + achievement_id length (4) + achievement_id + name length (4) + name + uri length (4) + uri
    // Collection pubkey is 32 bytes
    // For simplicity, assume collection is at a fixed offset - adjust based on actual IDL
    const collectionOffset = 8 + 4 + 32 + 4 + 64 + 4 + 200; // Approximate offset
    const collectionBytes = data.slice(collectionOffset, collectionOffset + 32);
    const collectionPubkey = new PublicKey(collectionBytes);

    // Build award_achievement instruction
    const instruction = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: configPda, isSigner: false, isWritable: false },
        { pubkey: achievementTypePda, isSigner: false, isWritable: true },
        { pubkey: achievementReceiptPda, isSigner: false, isWritable: true },
        { pubkey: minterRolePda, isSigner: false, isWritable: true },
        { pubkey: assetKeypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: collectionPubkey, isSigner: false, isWritable: true },
        { pubkey: recipient, isSigner: false, isWritable: false },
        { pubkey: recipientXpAta, isSigner: false, isWritable: true },
        { pubkey: XP_MINT, isSigner: false, isWritable: true },
        { pubkey: minterSigner.publicKey, isSigner: true, isWritable: true },
        { pubkey: minterSigner.publicKey, isSigner: true, isWritable: true }, // Payer
        { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: AWARD_ACHIEVEMENT_DISCRIMINATOR,
    });

    // Build and send transaction
    const transaction = new Transaction().add(instruction);
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = minterSigner.publicKey;

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [minterSigner, assetKeypair],
      { commitment: 'confirmed' }
    );

    return NextResponse.json({
      success: true,
      signature,
      achievementAsset: assetKeypair.publicKey.toBase58(),
      achievementId,
    });
  } catch (error) {
    console.error('Error awarding achievement:', error);

    // Check for specific error codes
    const errorMessage = error instanceof Error ? error.message : 'Failed to award achievement';

    if (errorMessage.includes('already in use') || errorMessage.includes('collision')) {
      return NextResponse.json(
        { success: false, error: 'Achievement already awarded to this recipient' },
        { status: 409 }
      );
    }

    if (errorMessage.includes('AchievementNotActive')) {
      return NextResponse.json(
        { success: false, error: 'Achievement type is not active' },
        { status: 400 }
      );
    }

    if (errorMessage.includes('AchievementSupplyExhausted')) {
      return NextResponse.json(
        { success: false, error: 'Achievement max supply reached' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
