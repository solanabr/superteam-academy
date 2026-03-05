import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { deriveLevel } from "../lib/level.js";
import { resolveUserId } from "../lib/user-identity.js";
import { recordStreakActivity } from "../lib/streak.js";
import { requireSession } from "../lib/auth-middleware.js";
import { listCourses } from "../lib/content-repository.js";
export async function progressRoutes(app) {
    app.get("/progress/user/:userId", async (request) => {
        const params = z
            .object({ userId: z.string().min(1) })
            .parse(request.params);
        const resolvedUserId = await resolveUserId(params.userId);
        const rows = await prisma.userProgress.findMany({
            where: { userId: resolvedUserId },
            select: {
                courseId: true,
                completionPercent: true,
                completedLessons: true,
                totalLessons: true,
                xpEarned: true,
                updatedAt: true,
            },
            orderBy: { updatedAt: "desc" },
        });
        return rows;
    });
    app.get("/progress/:courseId", async (request) => {
        const params = z
            .object({ courseId: z.string().min(1) })
            .parse(request.params);
        const query = z.object({ userId: z.string().min(1) }).parse(request.query);
        const resolvedUserId = await resolveUserId(query.userId);
        const progress = await prisma.userProgress.findUnique({
            where: {
                userId_courseId: {
                    userId: resolvedUserId,
                    courseId: params.courseId,
                },
            },
        });
        if (!progress) {
            return {
                userId: query.userId,
                courseId: params.courseId,
                completionPercent: 0,
                completedLessons: 0,
                totalLessons: 0,
                xpEarned: 0,
                level: 0,
                streak: 0,
            };
        }
        const streak = await prisma.streakState.findUnique({
            where: { userId: resolvedUserId },
        });
        return {
            userId: query.userId,
            courseId: params.courseId,
            completionPercent: progress.completionPercent,
            completedLessons: progress.completedLessons,
            totalLessons: progress.totalLessons,
            xpEarned: progress.xpEarned,
            level: deriveLevel(progress.xpEarned),
            streak: streak?.currentDays ?? 0,
        };
    });
    app.post("/progress/lesson/complete", {
        preHandler: [requireSession],
    }, async (request) => {
        const body = z
            .object({
            courseId: z.string().min(1),
            lessonId: z.string().min(1),
            xpReward: z.number().int().min(1).default(25),
        })
            .parse(request.body);
        const resolvedUserId = request.session.userId;
        const [existing, allCourses] = await Promise.all([
            prisma.userProgress.findUnique({
                where: {
                    userId_courseId: {
                        userId: resolvedUserId,
                        courseId: body.courseId,
                    },
                },
            }),
            listCourses(),
        ]);
        const completedLessons = (existing?.completedLessons ?? 0) + 1;
        const course = allCourses.find((entry) => entry.id === body.courseId);
        const totalLessons = Math.max(existing?.totalLessons ?? 0, course?.lessonCount ?? 1, completedLessons);
        const completionPercent = Math.min(100, Math.floor((completedLessons / totalLessons) * 100));
        const xpEarned = (existing?.xpEarned ?? 0) + body.xpReward;
        const progress = await prisma.userProgress.upsert({
            where: {
                userId_courseId: {
                    userId: resolvedUserId,
                    courseId: body.courseId,
                },
            },
            update: {
                completedLessons,
                totalLessons,
                completionPercent,
                xpEarned,
                lastLessonId: body.lessonId,
            },
            create: {
                userId: resolvedUserId,
                courseId: body.courseId,
                completedLessons,
                totalLessons,
                completionPercent,
                xpEarned,
                lastLessonId: body.lessonId,
            },
        });
        await prisma.activityFeed.create({
            data: {
                userId: resolvedUserId,
                kind: "lesson-complete",
                message: `Completed lesson ${body.lessonId}`,
                metadata: JSON.stringify({ courseId: body.courseId }),
            },
        });
        await recordStreakActivity(prisma, resolvedUserId, new Date(), false);
        const pending = await prisma.pendingAction.create({
            data: {
                userId: resolvedUserId,
                type: "lesson_complete",
                status: "accepted",
                courseId: body.courseId,
                lessonId: body.lessonId,
                metadata: {
                    xpReward: body.xpReward,
                },
            },
        });
        return {
            status: "accepted",
            pendingBackendSigner: true,
            requestId: pending.id,
            progress,
        };
    });
    app.post("/progress/course/finalize", {
        preHandler: [requireSession],
    }, async (request) => {
        const body = z
            .object({
            courseId: z.string().min(1),
        })
            .parse(request.body);
        const resolvedUserId = request.session.userId;
        await prisma.activityFeed.create({
            data: {
                userId: resolvedUserId,
                kind: "course-finalize-requested",
                message: `Requested finalize for course ${body.courseId}`,
            },
        });
        const pending = await prisma.pendingAction.create({
            data: {
                userId: resolvedUserId,
                type: "course_finalize",
                status: "accepted",
                courseId: body.courseId,
            },
        });
        return {
            status: "accepted",
            pendingBackendSigner: true,
            requestId: pending.id,
            message: "Course finalization is queued for backend co-sign flow",
        };
    });
}
