import { NextRequest, NextResponse } from 'next/server';
import { getCertificates } from '@/lib/content';

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet');

  const certificates = await getCertificates(wallet ?? undefined);

  return NextResponse.json({
    certificates,
    total: certificates.length,
  });
}
