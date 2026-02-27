import { NextResponse } from 'next/server';
import { courses } from '@/lib/data/courses';

export async function GET() {
  return NextResponse.json(courses);
}
