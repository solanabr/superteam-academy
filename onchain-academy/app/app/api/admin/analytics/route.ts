import { NextResponse } from 'next/server';
import { getAnalytics, testConnection } from '@/lib/sanity/admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'test-connection') {
    const result = await testConnection();
    return NextResponse.json(result);
  }

  const analytics = await getAnalytics();
  return NextResponse.json(analytics);
}
