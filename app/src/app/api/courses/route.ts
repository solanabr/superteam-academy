
import { NextResponse } from 'next/server';
import { ContentService } from '@/lib/content';

export async function GET() {
  try {
    const courses = await ContentService.getCourses();
    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Courses fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
