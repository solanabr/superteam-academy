import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Certificate } from '@/models';
import { credentialVerificationService } from '@/lib/services/credential-verification.service';
import mongoose from 'mongoose';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/certificates/[id] - Get certificate by ID (public for verification)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    await connectToDatabase();

    // Try to find by MongoDB ID or credential ID
    let certificate;
    if (mongoose.Types.ObjectId.isValid(id)) {
      certificate = await Certificate.findById(id).lean();
    }

    if (!certificate) {
      certificate = await Certificate.findOne({ credential_id: id }).lean();
    }

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // Get explorer links if on-chain
    let explorerLinks = null;
    if (certificate.on_chain && certificate.mint_address) {
      explorerLinks = credentialVerificationService.getExplorerLinks(certificate.mint_address);
    }

    // Transform to API response
    const response = {
      id: certificate._id.toString(),
      courseName: certificate.course_name,
      courseSlug: certificate.course_slug,
      courseDescription: certificate.course_description,
      issuedDate: certificate.issued_at.toISOString(),
      expirationDate: certificate.expires_at?.toISOString() || null,
      credentialId: certificate.credential_id,
      recipientName: certificate.recipient_name,
      recipientAddress: certificate.recipient_address,
      issuerName: certificate.issuer_name,
      issuerLogo: certificate.issuer_logo,
      verified: certificate.status === 'verified',
      onChain: certificate.on_chain,
      status: certificate.status,
      mintAddress: certificate.mint_address,
      transactionSignature: certificate.transaction_signature,
      metadataUri: certificate.metadata_uri,
      skills: certificate.skills,
      grade: certificate.grade,
      completionTime: certificate.completion_time,
      lessonsCompleted: certificate.lessons_completed,
      challengesSolved: certificate.challenges_solved,
      xpEarned: certificate.xp_earned,
      explorerLinks,
    };

    return NextResponse.json({ certificate: response });
  } catch (error) {
    console.error('GET /api/certificates/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
