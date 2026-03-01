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
  wallet: string;
  courseId: string;
  txSignature?: string | null;
}): Promise<void> {
  const prisma = getPrisma();
  await prisma.user.upsert({
    where: { wallet: params.wallet },
    create: { wallet: params.wallet },
    update: {},
  });
  const courseExists = await prisma.course.findUnique({
    where: { courseId: params.courseId },
  });
  if (courseExists) {
    await prisma.enrollment.upsert({
      where: {
        wallet_courseId: { wallet: params.wallet, courseId: params.courseId },
      },
      create: {
        wallet: params.wallet,
        courseId: params.courseId,
        txSignature: params.txSignature ?? null,
      },
      update: { txSignature: params.txSignature ?? undefined },
    });
  }
}

export async function indexLessonCompletion(params: {
  wallet: string;
  courseId: string;
  lessonIndex: number;
  xpPerLesson: number;
  txSignature: string;
  courseFinalized: boolean;
  courseXpEarned?: number;
}): Promise<void> {
  const prisma = getPrisma();
  await prisma.user.upsert({
    where: { wallet: params.wallet },
    create: { wallet: params.wallet },
    update: {},
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
    update: { txSignature: params.txSignature },
  });
  await prisma.user.update({
    where: { wallet: params.wallet },
    data: {
      totalXp: { increment: params.xpPerLesson },
      ...(params.courseFinalized ? { coursesCompleted: { increment: 1 } } : {}),
    },
  });
  if (params.courseFinalized) {
    const courseXp = params.courseXpEarned ?? params.xpPerLesson;
    await prisma.enrollment.updateMany({
      where: { wallet: params.wallet, courseId: params.courseId },
      data: {
        completedAt: new Date(),
        xpEarned: courseXp,
      },
    });
  }
}
