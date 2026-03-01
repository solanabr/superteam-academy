import { getPrisma } from "@/lib/prisma.js";

export async function indexCourse(params: {
  courseId: string;
  trackId: number;
  trackLevel: number;
  lessonCount: number;
  xpPerLesson: number;
  creator: string;
  txSignature: string;
}): Promise<void> {
  const prisma = getPrisma();
  await prisma.course.upsert({
    where: { courseId: params.courseId },
    create: {
      courseId: params.courseId,
      trackId: params.trackId,
      trackLevel: params.trackLevel,
      lessonCount: params.lessonCount,
      xpPerLesson: params.xpPerLesson,
      creator: params.creator,
      txSignature: params.txSignature,
    },
    update: {
      trackId: params.trackId,
      trackLevel: params.trackLevel,
      lessonCount: params.lessonCount,
      xpPerLesson: params.xpPerLesson,
      creator: params.creator,
      txSignature: params.txSignature,
    },
  });
}

export async function indexEnrollment(params: {
  learner: string;
  courseId: string;
  txSignature: string;
}): Promise<void> {
  const prisma = getPrisma();
  const course = await prisma.course.findUnique({
    where: { courseId: params.courseId },
  });
  if (!course) return;

  await prisma.user.upsert({
    where: { wallet: params.learner },
    create: {
      wallet: params.learner,
    },
    update: {},
  });

  await prisma.enrollment.upsert({
    where: {
      wallet_courseId: {
        wallet: params.learner,
        courseId: params.courseId,
      },
    },
    create: {
      wallet: params.learner,
      courseId: params.courseId,
      txSignature: params.txSignature,
    },
    update: {
      txSignature: params.txSignature,
    },
  });
}

export async function indexLessonCompletion(params: {
  wallet: string;
  courseId: string;
  lessonIndex: number;
  txSignature: string;
  xpPerLesson: number;
  isLastLesson: boolean;
  lessonCount: number;
}): Promise<void> {
  const prisma = getPrisma();

  await prisma.user.upsert({
    where: { wallet: params.wallet },
    create: {
      wallet: params.wallet,
      totalXp: params.xpPerLesson,
    },
    update: {
      totalXp: { increment: params.xpPerLesson },
      ...(params.isLastLesson && { coursesCompleted: { increment: 1 } }),
    },
  });

  await prisma.lessonCompletion.upsert({
    where: {
      wallet_courseId_lessonIndex: {
        wallet: params.wallet,
        courseId: params.courseId,
        lessonIndex: params.lessonIndex,
      },
    },
    create: {
      wallet: params.wallet,
      courseId: params.courseId,
      lessonIndex: params.lessonIndex,
      txSignature: params.txSignature,
    },
    update: {
      txSignature: params.txSignature,
    },
  });

  if (params.isLastLesson) {
    const xpEarned = params.lessonCount * params.xpPerLesson;
    await prisma.enrollment.updateMany({
      where: {
        wallet: params.wallet,
        courseId: params.courseId,
      },
      data: {
        completedAt: new Date(),
        xpEarned,
      },
    });
  }
}
