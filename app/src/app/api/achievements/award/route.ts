import { NextResponse } from 'next/server';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import {
  getBackendSigner,
  getServerConnection,
} from '@/lib/solana/server/signer';
import { checkRateLimit } from '@/lib/solana/server/rate-limit';
import {
  signAndConfirmTransaction,
  parseAnchorErrorCode,
} from '@/lib/solana/server/transaction';
import {
  validateRequest,
  isErrorResponse,
} from '@/lib/solana/server/validate';
import {
  configPda,
  achievementTypePda,
  achievementReceiptPda,
  minterRolePda,
} from '@/lib/solana/pda';
import {
  PROGRAM_ID,
  XP_MINT,
  TOKEN_2022_PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
} from '@/lib/solana/constants';
import { createHash } from 'crypto';

/**
 * POST /api/achievements/award
 *
 * Awards an achievement NFT to a recipient. Creates a new Metaplex Core
 * asset in the achievement's collection and mints XP reward to the
 * recipient's Token-2022 ATA.
 *
 * Body: { wallet: string, achievementId: string }
 */

const AWARD_ACHIEVEMENT_DISCRIMINATOR = Buffer.from(
  createHash('sha256')
    .update('global:award_achievement')
    .digest()
    .subarray(0, 8),
);

/**
 * Extracts the collection pubkey from raw AchievementType account data.
 *
 * AchievementType layout after discriminator:
 *   [8..12]    achievementId string length (u32 LE)
 *   [12..12+aLen] achievementId bytes
 *   [12+aLen..16+aLen] name string length (u32 LE)
 *   [16+aLen..16+aLen+nLen] name bytes
 *   [16+aLen+nLen..20+aLen+nLen] metadataUri string length (u32 LE)
 *   [20+aLen+nLen..20+aLen+nLen+uLen] metadataUri bytes
 *   [20+aLen+nLen+uLen..52+aLen+nLen+uLen] collection (Pubkey, 32 bytes)
 */
function extractCollectionFromAchievementData(
  data: Buffer,
  achievementId: string,
): PublicKey {
  const DISCRIMINATOR_SIZE = 8;
  let offset = DISCRIMINATOR_SIZE;

  // achievementId string
  const aLen = data.readUInt32LE(offset);
  offset += 4 + aLen;

  // name string
  const nLen = data.readUInt32LE(offset);
  offset += 4 + nLen;

  // metadataUri string
  const uLen = data.readUInt32LE(offset);
  offset += 4 + uLen;

  // collection pubkey (32 bytes)
  const collectionBytes = data.subarray(offset, offset + 32);
  if (collectionBytes.length !== 32) {
    throw new Error(
      `Failed to extract collection from achievement '${achievementId}' account data`,
    );
  }

  return new PublicKey(collectionBytes);
}

export async function POST(request: Request) {
  const validated = await validateRequest(request);
  if (isErrorResponse(validated)) return validated;

  const { wallet, body } = validated;
  const { achievementId } = body as { achievementId: string };

  if (!achievementId || typeof achievementId !== 'string') {
    return NextResponse.json(
      { error: 'Missing achievementId' },
      { status: 400 },
    );
  }

  const rateCheck = checkRateLimit(wallet.toBase58());
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateCheck.retryAfter },
      { status: 429 },
    );
  }

  try {
    const connection = getServerConnection();
    const backendSigner = getBackendSigner();
    const [config] = configPda();
    const [achievementType] = achievementTypePda(achievementId);
    const [achievementReceipt] = achievementReceiptPda(achievementId, wallet);
    const [minterRole] = minterRolePda(backendSigner.publicKey);

    // Fetch achievementType to extract the collection pubkey
    const achievementAccountInfo =
      await connection.getAccountInfo(achievementType);
    if (
      !achievementAccountInfo ||
      !achievementAccountInfo.owner.equals(PROGRAM_ID)
    ) {
      return NextResponse.json(
        { error: 'Achievement type not found' },
        { status: 404 },
      );
    }

    const collection = extractCollectionFromAchievementData(
      achievementAccountInfo.data as Buffer,
      achievementId,
    );

    // Generate a new keypair for the achievement NFT asset
    const asset = Keypair.generate();

    const recipientXpAta = getAssociatedTokenAddressSync(
      XP_MINT,
      wallet,
      false,
      TOKEN_2022_PROGRAM_ID,
    );

    // Instruction data: discriminator only (no additional args)
    const data = Buffer.from(AWARD_ACHIEVEMENT_DISCRIMINATOR);

    const keys = [
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: achievementType, isSigner: false, isWritable: true },
      { pubkey: achievementReceipt, isSigner: false, isWritable: true },
      { pubkey: minterRole, isSigner: false, isWritable: true },
      { pubkey: asset.publicKey, isSigner: true, isWritable: true },
      { pubkey: collection, isSigner: false, isWritable: true },
      { pubkey: wallet, isSigner: false, isWritable: false },
      { pubkey: recipientXpAta, isSigner: false, isWritable: true },
      { pubkey: XP_MINT, isSigner: false, isWritable: true },
      {
        pubkey: backendSigner.publicKey,
        isSigner: true,
        isWritable: true,
      },
      { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
      {
        pubkey: TOKEN_2022_PROGRAM_ID,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
    ];

    const instruction: TransactionInstruction = { keys, programId: PROGRAM_ID, data };
    const signature = await signAndConfirmTransaction(
      connection,
      [instruction],
      [backendSigner, asset],
      backendSigner.publicKey,
    );

    return NextResponse.json({
      signature,
      achievementId,
      asset: asset.publicKey.toBase58(),
    });
  } catch (err: unknown) {
    const errorCode = parseAnchorErrorCode(err);

    if (errorCode === 'AchievementAlreadyAwarded') {
      return NextResponse.json(
        { error: 'Achievement already awarded' },
        { status: 409 },
      );
    }
    if (errorCode === 'AchievementInactive') {
      return NextResponse.json(
        { error: 'Achievement is not active' },
        { status: 400 },
      );
    }
    if (errorCode === 'MaxSupplyReached') {
      return NextResponse.json(
        { error: 'Achievement max supply reached' },
        { status: 400 },
      );
    }
    if (errorCode === 'MinterNotActive') {
      return NextResponse.json(
        { error: 'Minter role not active' },
        { status: 403 },
      );
    }

    console.error('award_achievement failed:', err);
    return NextResponse.json(
      { error: 'Transaction failed' },
      { status: 500 },
    );
  }
}
