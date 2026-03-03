import { NextRequest, NextResponse } from 'next/server';
import {
  getAllLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
} from '@/lib/sanity/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const lesson = await getLessonById(id);
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }
    return NextResponse.json(lesson);
  }

  const lessons = await getAllLessons();
  return NextResponse.json(lessons);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await createLesson(body);
  return NextResponse.json(result, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing lesson id' }, { status: 400 });
  }

  const body = await request.json();
  const result = await updateLesson(id, body);
  return NextResponse.json(result);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing lesson id' }, { status: 400 });
  }

  await deleteLesson(id);
  return NextResponse.json({ success: true });
}
