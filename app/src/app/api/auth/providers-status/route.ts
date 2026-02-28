import { NextResponse } from 'next/server';
import { providerFlags } from '@/lib/auth';

export function GET() {
  return NextResponse.json(providerFlags);
}
