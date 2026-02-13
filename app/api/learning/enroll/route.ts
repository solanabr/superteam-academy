import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/server-session';
import { learningTransactionRelay } from '@/lib/learning/server-transaction-relay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface EnrollBody {
  courseId?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  let body: EnrollBody;

  try {
    body = (await request.json()) as EnrollBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const courseId = body.courseId?.trim();
  if (!courseId) {
    return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
  }

  const result = await learningTransactionRelay.enrollCourse({
    userId: session.user.id,
    courseId
  });

  return NextResponse.json({
    ok: true,
    enrolled: result.enrolled,
    tx: result.receipt
  });
}
