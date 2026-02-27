import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Certificate } from '@/models';
import { credentialVerificationService } from '@/lib/services/credential-verification.service';
import mongoose from 'mongoose';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/certificates/[id]/verify - Verify certificate on-chain
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    await connectToDatabase();

    // Find the certificate
    let certificate;
    if (mongoose.Types.ObjectId.isValid(id)) {
      certificate = await Certificate.findById(id);
    }

    if (!certificate) {
      certificate = await Certificate.findOne({ credential_id: id });
    }

    if (!certificate) {
      return NextResponse.json(
        {
          verified: false,
          error: 'Certificate not found',
        },
        { status: 404 }
      );
    }

    // If not on-chain, return basic verification
    if (!certificate.on_chain || !certificate.mint_address) {
      return NextResponse.json({
        verified: certificate.status !== 'revoked',
        onChain: false,
        certificate: {
          id: certificate._id.toString(),
          credentialId: certificate.credential_id,
          courseName: certificate.course_name,
          recipientName: certificate.recipient_name,
          recipientAddress: certificate.recipient_address,
          issuedDate: certificate.issued_at.toISOString(),
          status: certificate.status,
        },
        message: 'Certificate is valid but not minted on-chain',
      });
    }

    // Verify on-chain
    const verification = await credentialVerificationService.verifyCertificate(
      certificate.mint_address
    );

    // Get explorer links
    const explorerLinks = credentialVerificationService.getExplorerLinks(certificate.mint_address);

    // Update certificate status if verification was successful
    if (verification.isValid && certificate.status !== 'verified') {
      certificate.status = 'verified';
      certificate.verified_at = new Date();
      await certificate.save();
    }

    return NextResponse.json({
      verified: verification.isValid,
      onChain: verification.isOnChain,
      verification: {
        mintAddress: certificate.mint_address,
        owner: verification.owner,
        verifiedAt: verification.verifiedAt.toISOString(),
        errors: verification.errors,
      },
      certificate: {
        id: certificate._id.toString(),
        credentialId: certificate.credential_id,
        courseName: certificate.course_name,
        recipientName: certificate.recipient_name,
        recipientAddress: certificate.recipient_address,
        issuedDate: certificate.issued_at.toISOString(),
        status: certificate.status,
        grade: certificate.grade,
        xpEarned: certificate.xp_earned,
        skills: certificate.skills,
      },
      explorerLinks,
    });
  } catch (error) {
    console.error('GET /api/certificates/[id]/verify error:', error);
    return NextResponse.json(
      {
        verified: false,
        error: 'Verification failed',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/certificates/[id]/verify - Verify ownership of certificate
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Find the certificate
    let certificate;
    if (mongoose.Types.ObjectId.isValid(id)) {
      certificate = await Certificate.findById(id);
    }

    if (!certificate) {
      certificate = await Certificate.findOne({ credential_id: id });
    }

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // Check basic ownership (recipient address matches)
    const isRecipient = certificate.recipient_address.toLowerCase() === walletAddress.toLowerCase();

    // If on-chain, verify actual NFT ownership
    let isOnChainOwner = false;
    if (certificate.on_chain && certificate.mint_address) {
      isOnChainOwner = await credentialVerificationService.verifyOwnership(
        certificate.mint_address,
        walletAddress
      );
    }

    return NextResponse.json({
      isOwner: isRecipient || isOnChainOwner,
      isRecipient,
      isOnChainOwner,
      certificate: {
        id: certificate._id.toString(),
        credentialId: certificate.credential_id,
        courseName: certificate.course_name,
        onChain: certificate.on_chain,
      },
    });
  } catch (error) {
    console.error('POST /api/certificates/[id]/verify error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
