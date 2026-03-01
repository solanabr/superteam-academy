import { NextResponse } from 'next/server';

/**
 * GET/POST /api/courses/[slug]/reviews
 *
 * In-memory course review store. Learners submit ratings (1-5) with
 * optional comments. One review per wallet per course.
 *
 * NOTE: In-memory — resets on deploy/restart. Swap for a persistent
 * store (Supabase, Sanity) in production.
 */

interface Review {
  id: string;
  wallet: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const reviewStore = new Map<string, Review[]>();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params;
  const reviews = reviewStore.get(slug) ?? [];

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return NextResponse.json({
    reviews,
    averageRating: Math.round(avgRating * 10) / 10,
    total: reviews.length,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params;

  let body: { wallet?: string; rating?: number; comment?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.wallet || !body.rating || body.rating < 1 || body.rating > 5) {
    return NextResponse.json(
      { error: 'wallet (string) and rating (1-5) are required' },
      { status: 400 },
    );
  }

  if (typeof body.rating !== 'number' || !Number.isInteger(body.rating)) {
    return NextResponse.json(
      { error: 'rating must be an integer between 1 and 5' },
      { status: 400 },
    );
  }

  const existing = reviewStore.get(slug) ?? [];
  if (existing.some((r) => r.wallet === body.wallet)) {
    return NextResponse.json(
      { error: 'Already reviewed this course' },
      { status: 409 },
    );
  }

  const review: Review = {
    id: `review-${Date.now()}`,
    wallet: body.wallet,
    rating: body.rating,
    comment: body.comment ?? '',
    createdAt: new Date().toISOString(),
  };

  existing.push(review);
  reviewStore.set(slug, existing);

  return NextResponse.json({ review }, { status: 201 });
}
