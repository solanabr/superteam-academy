import { NextResponse } from 'next/server';
import {
  Keypair,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
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
  coursePda,
  enrollmentPda,
  trackCollectionPda,
  extractTrackIdFromCourseData,
} from '@/lib/solana/pda';
import {
  PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
} from '@/lib/solana/constants';
import { createHash } from 'crypto';
import BN from 'bn.js';

/**
 * POST /api/credentials/issue
 *
 * Issues a Metaplex Core credential NFT for a learner who has finalized
 * a course. The credential asset is created as a new keypair and added to
 * the track's collection.
 *
 * Body: {
 *   wallet: string,
 *   courseId: string,
 *   credentialName: string,
 *   metadataUri: string,
 *   coursesCompleted: number,
 *   totalXp: number
 * }
 */

const ISSUE_CREDENTIAL_DISCRIMINATOR = Buffer.from(
  createHash('sha256')
    .update('global:issue_credential')
    .digest()
    .subarray(0, 8),
);

/**
 * Serializes instruction data for issue_credential:
 *   discriminator (8 bytes)
 *   credentialName (4-byte len + UTF-8 bytes)
 *   metadataUri (4-byte len + UTF-8 bytes)
 *   coursesCompleted (u32 LE)
 *   totalXp (u64 LE)
 */
function serializeIssueCredentialData(params: {
  credentialName: string;
  metadataUri: string;
  coursesCompleted: number;
  totalXp: number;
}): Buffer {
  const nameBytes = Buffer.from(params.credentialName);
  const uriBytes = Buffer.from(params.metadataUri);

  const size =
    ISSUE_CREDENTIAL_DISCRIMINATOR.length +
    4 + nameBytes.length +
    4 + uriBytes.length +
    4 + // coursesCompleted u32
    8; // totalXp u64

  const buf = Buffer.alloc(size);
  let offset = 0;

  ISSUE_CREDENTIAL_DISCRIMINATOR.copy(buf, offset);
  offset += ISSUE_CREDENTIAL_DISCRIMINATOR.length;

  buf.writeUInt32LE(nameBytes.length, offset);
  offset += 4;
  nameBytes.copy(buf, offset);
  offset += nameBytes.length;

  buf.writeUInt32LE(uriBytes.length, offset);
  offset += 4;
  uriBytes.copy(buf, offset);
  offset += uriBytes.length;

  buf.writeUInt32LE(params.coursesCompleted, offset);
  offset += 4;

  const totalXpBn = new BN(params.totalXp);
  totalXpBn.toArrayLike(Buffer, 'le', 8).copy(buf, offset);

  return buf;
}

export async function POST(request: Request) {
  const validated = await validateRequest(request);
  if (isErrorResponse(validated)) return validated;

  const { wallet, body } = validated;
  const {
    courseId,
    credentialName,
    metadataUri,
    coursesCompleted,
    totalXp,
  } = body as {
    courseId: string;
    credentialName: string;
    metadataUri: string;
    coursesCompleted: number;
    totalXp: number;
  };

  if (!courseId || typeof courseId !== 'string') {
    return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
  }
  if (!credentialName || typeof credentialName !== 'string') {
    return NextResponse.json(
      { error: 'Missing credentialName' },
      { status: 400 },
    );
  }
  if (!metadataUri || typeof metadataUri !== 'string') {
    return NextResponse.json(
      { error: 'Missing metadataUri' },
      { status: 400 },
    );
  }
  if (
    typeof coursesCompleted !== 'number' ||
    !Number.isInteger(coursesCompleted) ||
    coursesCompleted < 0
  ) {
    return NextResponse.json(
      { error: 'Invalid coursesCompleted' },
      { status: 400 },
    );
  }
  if (typeof totalXp !== 'number' || totalXp < 0) {
    return NextResponse.json({ error: 'Invalid totalXp' }, { status: 400 });
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
    const [course] = coursePda(courseId);
    const [enrollment] = enrollmentPda(courseId, wallet);

    // Fetch course to extract trackId for collection derivation
    const courseAccountInfo = await connection.getAccountInfo(course);
    if (!courseAccountInfo || !courseAccountInfo.owner.equals(PROGRAM_ID)) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 },
      );
    }

    const trackId = extractTrackIdFromCourseData(
      courseAccountInfo.data as Buffer,
      courseId,
    );
    const [trackCollection] = trackCollectionPda(trackId);

    // Generate a new keypair for the credential NFT asset
    const credentialAsset = Keypair.generate();

    const data = serializeIssueCredentialData({
      credentialName,
      metadataUri,
      coursesCompleted,
      totalXp,
    });

    const keys = [
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: course, isSigner: false, isWritable: false },
      { pubkey: enrollment, isSigner: false, isWritable: true },
      { pubkey: wallet, isSigner: false, isWritable: false },
      { pubkey: credentialAsset.publicKey, isSigner: true, isWritable: true },
      { pubkey: trackCollection, isSigner: false, isWritable: true },
      {
        pubkey: backendSigner.publicKey,
        isSigner: true,
        isWritable: true,
      },
      { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
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
      [backendSigner, credentialAsset],
      backendSigner.publicKey,
    );

    return NextResponse.json({
      signature,
      courseId,
      credentialAsset: credentialAsset.publicKey.toBase58(),
    });
  } catch (err: unknown) {
    const errorCode = parseAnchorErrorCode(err);

    if (errorCode === 'CredentialAlreadyIssued') {
      return NextResponse.json(
        { error: 'Credential already issued' },
        { status: 409 },
      );
    }
    if (errorCode === 'CourseNotFinalized') {
      return NextResponse.json(
        { error: 'Course not yet finalized' },
        { status: 400 },
      );
    }

    console.error('issue_credential failed:', err);
    return NextResponse.json(
      { error: 'Transaction failed' },
      { status: 500 },
    );
  }
}
