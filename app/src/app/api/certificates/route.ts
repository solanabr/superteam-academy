import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Certificate } from '@/models';
import mongoose from 'mongoose';

/**
 * GET /api/certificates - Get all certificates for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const courseSlug = searchParams.get('course');

    // Build query
    const query: Record<string, unknown> = {
      user_id: new mongoose.Types.ObjectId(session.user.id),
    };

    if (status) {
      query.status = status;
    }

    if (courseSlug) {
      query.course_slug = courseSlug;
    }

    const certificates = await Certificate.find(query).sort({ issued_at: -1 }).lean();

    // Transform to API response format
    const response = certificates.map((cert) => ({
      id: cert._id.toString(),
      courseName: cert.course_name,
      courseSlug: cert.course_slug,
      courseDescription: cert.course_description,
      issuedDate: cert.issued_at.toISOString(),
      expirationDate: cert.expires_at?.toISOString() || null,
      credentialId: cert.credential_id,
      recipientName: cert.recipient_name,
      recipientAddress: cert.recipient_address,
      issuerName: cert.issuer_name,
      issuerLogo: cert.issuer_logo,
      verified: cert.status === 'verified',
      onChain: cert.on_chain,
      status: cert.status,
      mintAddress: cert.mint_address,
      transactionSignature: cert.transaction_signature,
      metadataUri: cert.metadata_uri,
      skills: cert.skills,
      grade: cert.grade,
      completionTime: cert.completion_time,
      lessonsCompleted: cert.lessons_completed,
      challengesSolved: cert.challenges_solved,
      xpEarned: cert.xp_earned,
    }));

    return NextResponse.json({ certificates: response });
  } catch (error) {
    console.error('GET /api/certificates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/certificates - Create a new certificate (admin or after course completion)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const {
      courseId,
      courseSlug,
      courseName,
      courseDescription,
      recipientName,
      recipientAddress,
      grade,
      xpEarned,
      lessonsCompleted,
      challengesSolved,
      completionTime,
      skills,
    } = body;

    if (!courseId || !courseName || !recipientAddress) {
      return NextResponse.json(
        { error: 'courseId, courseName, and recipientAddress are required' },
        { status: 400 }
      );
    }

    // Generate credential ID
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const credentialId = `CERT-${courseSlug?.toUpperCase().slice(0, 3) || 'CRS'}-${timestamp}-${random}`;

    // Check if certificate already exists for this user and course
    const existing = await Certificate.findOne({
      user_id: new mongoose.Types.ObjectId(session.user.id),
      course_id: courseId,
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Certificate already exists for this course', certificateId: existing._id },
        { status: 409 }
      );
    }

    // Create certificate
    const certificate = await Certificate.create({
      user_id: new mongoose.Types.ObjectId(session.user.id),
      course_id: courseId,
      course_slug: courseSlug || courseId,
      course_name: courseName,
      course_description: courseDescription || '',
      credential_id: credentialId,
      recipient_name: recipientName || session.user.name || 'Student',
      recipient_address: recipientAddress,
      grade: grade || 'Pass',
      xp_earned: xpEarned || 0,
      lessons_completed: lessonsCompleted || 0,
      challenges_solved: challengesSolved || 0,
      completion_time: completionTime || '',
      skills: skills || [],
      status: 'pending',
      on_chain: false,
    });

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate._id.toString(),
        credentialId: certificate.credential_id,
        courseName: certificate.course_name,
        status: certificate.status,
      },
    });
  } catch (error) {
    console.error('POST /api/certificates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
