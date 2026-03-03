import { NextRequest, NextResponse } from 'next/server';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from '@/lib/sanity/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const course = await getCourseById(id);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    return NextResponse.json(course);
  }

  const courses = await getAllCourses();
  return NextResponse.json(courses);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await createCourse(body);
  return NextResponse.json(result, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing course id' }, { status: 400 });
  }

  const body = await request.json();
  const result = await updateCourse(id, body);
  return NextResponse.json(result);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing course id' }, { status: 400 });
  }

  await deleteCourse(id);
  return NextResponse.json({ success: true });
}
