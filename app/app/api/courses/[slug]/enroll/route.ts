import { NextRequest, NextResponse } from 'next/server';
import { getCourseBySlug } from '@/lib/content';

// In-memory enrollment store (production would use on-chain + DB)
const enrollments = new Map<string, Set<string>>();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();
  const { walletAddress } = body;

  if (!walletAddress || typeof walletAddress !== 'string') {
    return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 });
  }

  const course = await getCourseBySlug(slug);
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  if (!enrollments.has(slug)) {
    enrollments.set(slug, new Set());
  }

  const courseEnrollments = enrollments.get(slug)!;
  if (courseEnrollments.has(walletAddress)) {
    return NextResponse.json({ error: 'Already enrolled' }, { status: 409 });
  }

  // Cap enrollments per course
  if (courseEnrollments.size >= 10000) {
    const first = courseEnrollments.values().next().value;
    if (first) courseEnrollments.delete(first);
  }
  courseEnrollments.add(walletAddress);

  return NextResponse.json({
    enrolled: true,
    courseId: course.id,
    walletAddress,
    enrolledAt: new Date().toISOString(),
  }, { status: 201 });
}
