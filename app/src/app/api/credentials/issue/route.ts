/**
 * Credential Issuance API Route
 * Backend-signed transaction for issuing Metaplex Core NFT credentials
 *
 * POST /api/credentials/issue
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

// Instruction discriminator for issue_credential
const ISSUE_CREDENTIAL_DISCRIMINATOR = Buffer.from([
  0x45, 0x67, 0x2a, 0xf1, 0xc8, 0x99, 0x12, 0xab,
]);

// Track collection addresses (would be created during program setup)
const TRACK_COLLECTIONS: Record<number, string> = {
  1: 'CoLLECT1onsCoreSoLana1111111111111111111111', // Solana Core track
  2: 'CoLLECT1onsAnchor1111111111111111111111111', // Anchor track
  3: 'CoLLECT1onsDeFi11111111111111111111111111', // DeFi track
  4: 'CoLLECT1onsNFTs11111111111111111111111111', // NFTs track
  5: 'CoLLECT1onsDAOs11111111111111111111111111', // DAOs track
  6: 'CoLLECT1onsSecurity111111111111111111111', // Security track
};

interface IssueCredentialRequest {
  courseId: string;
  learnerWallet: string;
}

interface IssueCredentialResponse {
  success: boolean;
  signature?: string;
  credentialAsset?: string;
  credentialName?: string;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<IssueCredentialResponse>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const body: IssueCredentialRequest = await req.json();
    const { courseId, learnerWallet } = body;

    if (!courseId || !learnerWallet) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const learner = new PublicKey(learnerWallet);

    // Fetch course and enrollment
    const [course, enrollment] = await Promise.all([
      fetchCourse(courseId),
      fetchEnrollment(courseId, learner),
    ]);

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 400 }
      );
    }

    if (!enrollment.isCompleted) {
      return NextResponse.json(
        { success: false, error: 'Course not yet finalized' },
        { status: 400 }
      );
    }

    // Check if credential already issued
    if (enrollment.credentialAsset) {
      return NextResponse.json({
        success: true,
        credentialAsset: enrollment.credentialAsset.toBase58(),
        credentialName: `${course.trackName} Credential`,
      });
    }

    // Get backend signer
    const backendSignerSecret = process.env.BACKEND_SIGNER_SECRET_KEY;
    if (!backendSignerSecret) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const endpoint = RPC_ENDPOINTS[NETWORK as keyof typeof RPC_ENDPOINTS];
    const connection = new Connection(endpoint, 'confirmed');
    const backendSigner = Keypair.fromSecretKey(Buffer.from(JSON.parse(backendSignerSecret)));

    // Generate new credential asset keypair
    const credentialAsset = Keypair.generate();

    // Get track collection
    const trackCollectionStr = TRACK_COLLECTIONS[course.trackId];
    if (!trackCollectionStr) {
      return NextResponse.json(
        { success: false, error: `No collection for track ${course.trackId}` },
        { status: 400 }
      );
    }
    const trackCollection = new PublicKey(trackCollectionStr);

    // Build credential metadata
    const trackName = TRACK_IDS[course.trackId] || `Track ${course.trackId}`;
    const credentialName = `${trackName} - Level ${course.trackLevel}`;
    const metadataUri = `https://arweave.net/credential-metadata-${course.trackId}-${course.trackLevel}`;

    // Get learner's total XP
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

    // Derive PDAs
    const [configPda] = deriveConfigPda();
    const [coursePda] = deriveCoursePda(courseId);
    const [enrollmentPda] = deriveEnrollmentPda(courseId, learner);

    // Encode instruction data
    // issue_credential(credential_name, metadata_uri, courses_completed, total_xp)
    const credentialNameBytes = Buffer.from(credentialName, 'utf8');
    const metadataUriBytes = Buffer.from(metadataUri, 'utf8');
    const totalXpBn = new BN(totalXp);

    const data = Buffer.concat([
      ISSUE_CREDENTIAL_DISCRIMINATOR,
      // credential_name as string
      Buffer.from([credentialNameBytes.length]),
      credentialNameBytes,
      // metadata_uri as string
      Buffer.from([metadataUriBytes.length]),
      metadataUriBytes,
      // courses_completed as u32
      Buffer.from(new Uint32Array([coursesCompleted]).buffer),
      // total_xp as u64
      totalXpBn.toArrayLike(Buffer, 'le', 8),
    ]);

    // Create issue_credential instruction
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: configPda, isSigner: false, isWritable: false },
        { pubkey: coursePda, isSigner: false, isWritable: false },
        { pubkey: enrollmentPda, isSigner: false, isWritable: true },
        { pubkey: learner, isSigner: false, isWritable: false },
        { pubkey: credentialAsset.publicKey, isSigner: true, isWritable: true },
        { pubkey: trackCollection, isSigner: false, isWritable: true },
        { pubkey: backendSigner.publicKey, isSigner: true, isWritable: true }, // payer
        { pubkey: backendSigner.publicKey, isSigner: true, isWritable: false },
        { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data,
    });

    // Build and send transaction
    const transaction = new Transaction().add(instruction);
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = backendSigner.publicKey;

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [backendSigner, credentialAsset],
      { commitment: 'confirmed' }
    );

    console.log(
      `Credential issued: course=${courseId}, learner=${learnerWallet}, asset=${credentialAsset.publicKey.toBase58()}, sig=${signature}`
    );

    return NextResponse.json({
      success: true,
      signature,
      credentialAsset: credentialAsset.publicKey.toBase58(),
      credentialName,
    });
  } catch (error) {
    console.error('Error issuing credential:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
