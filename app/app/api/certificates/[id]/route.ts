import { NextRequest, NextResponse } from 'next/server';
import { getCertificateById } from '@/lib/content';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Certificate ID required' }, { status: 400 });
  }

  const certificate = await getCertificateById(id);
  if (!certificate) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
  }

  return NextResponse.json({ certificate });
}
