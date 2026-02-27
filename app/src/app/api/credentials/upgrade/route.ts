/**
 * Credential Upgrade API Route
 * Backend-signed transaction for upgrading existing Metaplex Core NFT credentials
 *
 * POST /api/credentials/upgrade
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
  MPL_CORE_PROGRAM_ID,
  RPC_ENDPOINTS,
  NETWORK,
  TRACK_IDS,
} from '@/lib/solana/program-config';
import { deriveConfigPda, deriveCoursePda, deriveEnrollmentPda } from '@/lib/solana/pda';
import { fetchEnrollment, fetchCourse, fetchXpBalance } from '@/lib/solana/program-client';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { User, CourseEnrollment } from '@/models';
import { BN } from '@coral-xyz/anchor';

// Instruction discriminator for upgrade_credential
const UPGRADE_CREDENTIAL_DISCRIMINATOR = Buffer.from([
  0x56, 0x78, 0x3b, 0xe2, 0xd9, 0xaa, 0x23, 0xbc,
]);

// Track collection addresses
const TRACK_COLLECTIONS: Record<number, string> = {
  1: 'CoLLECT1onsCoreSoLana1111111111111111111111',
  2: 'CoLLECT1onsAnchor1111111111111111111111111',
  3: 'CoLLECT1onsDeFi11111111111111111111111111',
  4: 'CoLLECT1onsNFTs11111111111111111111111111',
  5: 'CoLLECT1onsDAOs11111111111111111111111111',
  6: 'CoLLECT1onsSecurity111111111111111111111',
};

interface UpgradeCredentialRequest {
  courseId: string;
  learnerWallet: string;
  credentialName: string;
  metadataUri: string;
}

interface UpgradeCredentialResponse {
  success: boolean;
  signature?: string;
  credentialAsset?: string;
  credentialName?: string;
  totalXp?: number;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<UpgradeCredentialResponse>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const body: UpgradeCredentialRequest = await req.json();
    const { courseId, learnerWallet, credentialName, metadataUri } = body;

    if (!courseId || !learnerWallet || !credentialName || !metadataUri) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const learner = new PublicKey(learnerWallet);

    // Fetch enrollment and verify it's finalized with existing credential
    const enrollment = await fetchEnrollment(courseId, learner);
    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 400 }
      );
    }

    if (!enrollment.completedAt) {
      return NextResponse.json(
        { success: false, error: 'Course not finalized yet' },
        { status: 400 }
      );
    }

    if (!enrollment.credentialAsset) {
      return NextResponse.json(
        { success: false, error: 'No credential issued yet - use issue endpoint first' },
        { status: 400 }
      );
    }

    // Fetch course for track info
    const course = await fetchCourse(courseId);
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    // Fetch current XP balance for attributes
    const totalXp = await fetchXpBalance(learner);

    // Count completed courses for wallet-linked user from MongoDB
    let coursesCompleted = 0;
    await connectToDatabase();
    const linkedUser = await User.findOne({ wallet_address: learnerWallet }).select('_id');
    if (linkedUser) {
      coursesCompleted = await CourseEnrollment.countDocuments({
        user_id: linkedUser._id,
        completed_at: { $ne: null },
      });
    }

    // Get backend signer
    const backendSignerSecret = process.env.BACKEND_SIGNER_SECRET_KEY;
    if (!backendSignerSecret) {
      console.error('BACKEND_SIGNER_SECRET_KEY not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const backendSigner = Keypair.fromSecretKey(Buffer.from(JSON.parse(backendSignerSecret)));

    // Get connection
    const rpcUrl = RPC_ENDPOINTS[NETWORK as keyof typeof RPC_ENDPOINTS];
    const connection = new Connection(rpcUrl, 'confirmed');

    // Derive PDAs
    const [configPda] = deriveConfigPda();
    const [coursePda] = deriveCoursePda(courseId);
    const [enrollmentPda] = deriveEnrollmentPda(courseId, learner);

    // Get track collection
    const trackCollectionAddress = TRACK_COLLECTIONS[course.trackId];
    if (!trackCollectionAddress) {
      return NextResponse.json({ success: false, error: 'Invalid track ID' }, { status: 400 });
    }
    const trackCollection = new PublicKey(trackCollectionAddress);

    // Existing credential asset
    const credentialAsset = new PublicKey(enrollment.credentialAsset);

    // Build upgrade_credential instruction
    // Args: credential_name (string), metadata_uri (string), courses_completed (u32), total_xp (u64)
    const credentialNameBytes = Buffer.from(credentialName, 'utf-8');
    const metadataUriBytes = Buffer.from(metadataUri, 'utf-8');

    const argsBuffer = Buffer.alloc(
      4 +
        credentialNameBytes.length + // name length prefix + name
        4 +
        metadataUriBytes.length + // uri length prefix + uri
        4 + // courses_completed (u32)
        8 // total_xp (u64)
    );

    let offset = 0;
    argsBuffer.writeUInt32LE(credentialNameBytes.length, offset);
    offset += 4;
    credentialNameBytes.copy(argsBuffer, offset);
    offset += credentialNameBytes.length;

    argsBuffer.writeUInt32LE(metadataUriBytes.length, offset);
    offset += 4;
    metadataUriBytes.copy(argsBuffer, offset);
    offset += metadataUriBytes.length;

    argsBuffer.writeUInt32LE(coursesCompleted, offset);
    offset += 4;

    const totalXpBn = new BN(totalXp);
    totalXpBn.toArrayLike(Buffer, 'le', 8).copy(argsBuffer, offset);

    const instructionData = Buffer.concat([UPGRADE_CREDENTIAL_DISCRIMINATOR, argsBuffer]);

    // Build instruction with accounts matching the program
    const instruction = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: configPda, isSigner: false, isWritable: false },
        { pubkey: coursePda, isSigner: false, isWritable: false },
        { pubkey: enrollmentPda, isSigner: false, isWritable: false },
        { pubkey: learner, isSigner: false, isWritable: false },
        { pubkey: credentialAsset, isSigner: false, isWritable: true },
        { pubkey: trackCollection, isSigner: false, isWritable: false },
        { pubkey: backendSigner.publicKey, isSigner: true, isWritable: true },
        { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: instructionData,
    });

    // Build and send transaction
    const transaction = new Transaction().add(instruction);
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = backendSigner.publicKey;

    const signature = await sendAndConfirmTransaction(connection, transaction, [backendSigner], {
      commitment: 'confirmed',
    });

    return NextResponse.json({
      success: true,
      signature,
      credentialAsset: credentialAsset.toBase58(),
      credentialName,
      totalXp,
    });
  } catch (error) {
    console.error('Error upgrading credential:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upgrade credential',
      },
      { status: 500 }
    );
  }
}
