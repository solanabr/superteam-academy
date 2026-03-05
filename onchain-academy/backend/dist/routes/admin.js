import { z } from "zod";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { listCourses } from "../lib/content-repository.js";
export async function adminRoutes(app) {
    app.addHook("preHandler", async (request, reply) => {
        if (request.headers["x-admin-token"] === env.ADMIN_TOKEN) {
            return;
        }
        const walletHeader = request.headers["x-admin-wallet"];
        const walletAddress = typeof walletHeader === "string" ? walletHeader.trim() : "";
        if (!walletAddress) {
            return reply.code(401).send({ error: "Unauthorized" });
        }
        const walletLink = await prisma.walletLink.findUnique({
            where: { address: walletAddress },
        });
        if (!walletLink) {
            return reply.code(401).send({ error: "Unauthorized" });
        }
        const user = await prisma.user.findUnique({
            where: { id: walletLink.userId },
        });
        const isAdmin = user?.isAdmin === true;
        if (!isAdmin) {
            return reply.code(401).send({ error: "Unauthorized" });
        }
    });
    app.get("/admin/kpis", async () => {
        const [users, progressRows, attempts] = await Promise.all([
            prisma.user.count(),
            prisma.userProgress.findMany(),
            prisma.lessonAttempt.count(),
        ]);
        const activeLearners = new Set(progressRows.map((row) => row.userId)).size;
        const totalXp = progressRows.reduce((sum, row) => sum + row.xpEarned, 0);
        return {
            users,
            activeLearners,
            totalXp,
            lessonAttempts: attempts,
            conversionRate: users === 0 ? 0 : Math.round((activeLearners / users) * 100),
        };
    });
    app.get("/admin/users", async (request) => {
        const query = z
            .object({
            page: z.coerce.number().min(1).default(1),
            pageSize: z.coerce.number().min(1).max(100).default(20),
        })
            .parse(request.query);
        const [total, users] = await Promise.all([
            prisma.user.count(),
            prisma.user.findMany({
                skip: (query.page - 1) * query.pageSize,
                take: query.pageSize,
                orderBy: { createdAt: "desc" },
                include: {
                    walletLinks: true,
                    authProviderLinks: {
                        select: { provider: true },
                    },
                    progress: true,
                },
            }),
        ]);
        return {
            total,
            page: query.page,
            pageSize: query.pageSize,
            items: users.map((user) => ({
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                wallets: user.walletLinks.length,
                providers: user.authProviderLinks.map((provider) => provider.provider),
                coursesInProgress: user.progress.length,
                createdAt: user.createdAt.toISOString(),
            })),
        };
    });
    app.patch("/admin/users/:id", async (request, reply) => {
        const params = z
            .object({
            id: z.string().min(1),
        })
            .parse(request.params);
        const body = z
            .object({
            username: z
                .string()
                .min(3)
                .max(40)
                .regex(/^[a-zA-Z0-9_-]+$/)
                .optional(),
            displayName: z.string().min(1).max(80).optional(),
            profileVisibility: z.enum(["public", "private"]).optional(),
        })
            .refine((value) => value.username !== undefined ||
            value.displayName !== undefined ||
            value.profileVisibility !== undefined, {
            message: "At least one field must be provided",
        })
            .parse(request.body);
        try {
            const user = await prisma.user.update({
                where: { id: params.id },
                data: {
                    ...(body.username !== undefined ? { username: body.username } : {}),
                    ...(body.displayName !== undefined
                        ? { displayName: body.displayName }
                        : {}),
                    ...(body.profileVisibility !== undefined
                        ? { profileVisibility: body.profileVisibility }
                        : {}),
                },
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    profileVisibility: true,
                    updatedAt: true,
                },
            });
            return user;
        }
        catch (error) {
            if (typeof error === "object" &&
                error !== null &&
                "code" in error &&
                error.code === "P2002") {
                return reply.code(409).send({ error: "Username already exists" });
            }
            throw error;
        }
    });
    app.get("/admin/courses", async () => {
        const progress = await prisma.userProgress.findMany();
        const courses = await listCourses();
        return courses.map((course) => {
            const courseProgress = progress.filter((row) => row.courseId === course.id);
            const avgCompletion = courseProgress.length === 0
                ? 0
                : Math.round(courseProgress.reduce((sum, row) => sum + row.completionPercent, 0) / courseProgress.length);
            return {
                id: course.id,
                slug: course.slug,
                title: course.title,
                track: course.track,
                learners: courseProgress.length,
                avgCompletion,
            };
        });
    });
}
