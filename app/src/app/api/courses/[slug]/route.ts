import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const course = await prisma.course.findUnique({
      where: { slug: params.slug },
      include: {
        modules: {
          include: {
            lessons: {
              orderBy: { order: 'asc' } // Важно для правильной нумерации!
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Трансформируем данные в удобный для фронтенда формат (как было раньше)
    const flatLessons = course.modules.flatMap(m => m.lessons);

    const formattedData = {
        id: course.slug,
        title: course.title,
        description: course.description,
        difficulty: course.difficulty,
        xpPerLesson: course.xpPerLesson,
        imageUrl: course.imageUrl,
        modules: course.modules,
        lessons: flatLessons // Плоский список для легкой навигации по индексам
    };

    return NextResponse.json(formattedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}