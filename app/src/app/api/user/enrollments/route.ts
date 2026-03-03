// app/src/app/api/user/enrollments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    console.log(`[API /enrollments] Fetching enrollments for wallet: ${wallet}`);

    if (!wallet) return NextResponse.json([]);

    const user = await prisma.user.findUnique({
        where: { walletAddress: wallet },
        include: { 
            enrollments: true,
            progress: { where: { status: "completed" } } 
        }
    });

    if (!user) {
        console.log(`[API /enrollments] User not found in DB`);
        return NextResponse.json([]);
    }

    console.log(`[API /enrollments] User has ${user.enrollments.length} enrollments and ${user.progress.length} completed lessons in total.`);

    const courseIds = user.enrollments.map(e => e.courseId);
    
    // Получаем курсы вместе с их уроками для точного подсчета
    const courses = await prisma.course.findMany({
        where: { slug: { in: courseIds } },
        include: {
            modules: { 
                include: { lessons: true } 
            }
        }
    });

    const formattedEnrollments = user.enrollments.map(e => {
        const course = courses.find(c => c.slug === e.courseId);
        
        // Надежный подсчет уроков
        let totalLessons = 0;
        if (course && course.modules) {
            course.modules.forEach(mod => {
                if (mod.lessons) totalLessons += mod.lessons.length;
            });
        }
        
        // Защита от деления на ноль: если в курсе 0 уроков, считаем как 1, чтобы не сломать UI
        const safeTotalLessons = totalLessons > 0 ? totalLessons : 1;
        
        // Считаем пройденные уроки именно для этого курса
        const completedLessons = user.progress.filter(p => p.courseId === e.courseId).length;

        // Вычисляем процент
        let progressPercent = Math.round((completedLessons / safeTotalLessons) * 100);
        if (progressPercent > 100) progressPercent = 100;

        console.log(`[API /enrollments] Course: ${e.courseId} | Completed: ${completedLessons}/${safeTotalLessons} | Progress: ${progressPercent}%`);

        return {
            courseId: e.courseId,
            enrolledAt: e.enrolledAt.toISOString(),
            progressPercent: progressPercent,
            totalLessons: safeTotalLessons,
            completedLessons: completedLessons
        };
    });

    return NextResponse.json(formattedEnrollments);

  } catch (error: any) {
    console.error("[API /enrollments] Fatal Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}