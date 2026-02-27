import { NextRequest, NextResponse } from 'next/server';
import { ContentService } from '@/lib/content';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
     const { slug, id } = await params;
     const course = await ContentService.getCourseBySlug(slug);

     if (!course) {
         return NextResponse.json({ error: 'Course not found' }, { status: 404 });
     }

     let lesson = null;
     for (const module of course.modules) {
         const found = module.lessons.find(l => l.id === id);
         if (found) {
             lesson = found;
             break;
         }
     }

     if (!lesson) {
         return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
     }

     return NextResponse.json({
         course: {
             title: course.title,
             slug: course.slug,
             modules: course.modules // We might want to trim this for large courses, but okay for now
         },
         lesson
     });

  } catch (error) {
      console.error(error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
