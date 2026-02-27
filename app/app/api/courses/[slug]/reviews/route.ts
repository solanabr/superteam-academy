import { NextRequest, NextResponse } from 'next/server';
import { getCourseBySlug } from '@/lib/content';

interface Review {
  id: string;
  walletAddress: string;
  courseSlug: string;
  rating: number;
  text: string;
  createdAt: string;
}

// In-memory review store
const reviewStore = new Map<string, Review[]>();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const course = await getCourseBySlug(slug);
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  const reviews = reviewStore.get(slug) ?? [];
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return NextResponse.json({
    courseSlug: slug,
    reviews,
    total: reviews.length,
    averageRating: Math.round(avgRating * 10) / 10,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();
  const { walletAddress, rating, text } = body;

  if (!walletAddress || typeof walletAddress !== 'string') {
    return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be an integer 1-5' }, { status: 400 });
  }
  if (text && typeof text === 'string' && text.length > 1000) {
    return NextResponse.json({ error: 'Review text must be under 1000 characters' }, { status: 400 });
  }

  const course = await getCourseBySlug(slug);
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  if (!reviewStore.has(slug)) {
    reviewStore.set(slug, []);
  }

  const existing = reviewStore.get(slug)!;
  if (existing.some(r => r.walletAddress === walletAddress)) {
    return NextResponse.json({ error: 'One review per wallet per course' }, { status: 409 });
  }

  const review: Review = {
    id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    walletAddress,
    courseSlug: slug,
    rating,
    text: text ?? '',
    createdAt: new Date().toISOString(),
  };

  existing.push(review);

  return NextResponse.json({ review }, { status: 201 });
}
