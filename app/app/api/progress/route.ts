import { NextRequest, NextResponse } from 'next/server';

// In-memory progress for demo. Replace with DB (e.g. Prisma + PostgreSQL) for production.
const progressStore: Record<string, Record<string, string[]>> = {};

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet');
  if (!wallet) {
    return NextResponse.json({ completedLessons: {} });
  }
  const completed = progressStore[wallet] ?? {};
  return NextResponse.json({ completedLessons: completed });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { wallet, courseId, lessonId } = body;
  if (!wallet || !courseId || !lessonId) {
    return NextResponse.json(
      { error: 'wallet, courseId, and lessonId required' },
      { status: 400 }
    );
  }
  if (!progressStore[wallet]) progressStore[wallet] = {};
  if (!progressStore[wallet][courseId]) progressStore[wallet][courseId] = [];
  if (!progressStore[wallet][courseId].includes(lessonId)) {
    progressStore[wallet][courseId].push(lessonId);
  }
  return NextResponse.json({
    completedLessons: progressStore[wallet],
  });
}
