import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { resolveUserId } from "../lib/user-identity.js";
import { requireSession } from "../lib/auth-middleware.js";
import { deriveLevel } from "../lib/level.js";
const visibility = z.enum(["public", "private"]);
export async function userRoutes(app) {
    app.get("/user/public/:username", async (request, reply) => {
        const params = z
            .object({ username: z.string().min(1) })
            .parse(request.params);
        const user = await prisma.user.findUnique({
            where: { username: params.username },
            select: {
                id: true,
                username: true,
                displayName: true,
                bio: true,
                profileVisibility: true,
            },
        });
        if (!user) {
            return reply.code(404).send({ error: "User not found" });
        }
        const [primaryWallet, progressRows] = await Promise.all([
            prisma.walletLink.findFirst({
                where: { userId: user.id },
                orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
                select: { address: true },
            }),
            prisma.userProgress.findMany({
                where: { userId: user.id },
                select: { xpEarned: true },
            }),
        ]);
        const xp = progressRows.reduce((sum, row) => sum + row.xpEarned, 0);
        return {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            bio: user.bio,
            profileVisibility: user.profileVisibility,
            walletAddress: primaryWallet?.address ?? null,
            xp,
            level: deriveLevel(xp),
        };
    });
    app.get("/user/is-admin/:wallet", async (request, reply) => {
        const params = z
            .object({ wallet: z.string().min(32) })
            .parse(request.params);
        const link = await prisma.walletLink.findUnique({
            where: { address: params.wallet },
            include: { user: { select: { isAdmin: true } } },
        });
        if (!link) {
            return reply.code(200).send({ isAdmin: false });
        }
        return { isAdmin: link.user.isAdmin };
    });
    app.get("/user/profile/:userId", async (request) => {
        const params = z
            .object({ userId: z.string().min(1) })
            .parse(request.params);
        const resolvedUserId = await resolveUserId(params.userId);
        const user = await prisma.user.findUnique({
            where: { id: resolvedUserId },
            select: {
                id: true,
                username: true,
                displayName: true,
                email: true,
                bio: true,
                avatarUrl: true,
                twitterUrl: true,
                githubUrl: true,
                language: true,
                theme: true,
                profileVisibility: true,
            },
        });
        if (!user) {
            return {
                id: resolvedUserId,
                username: null,
                displayName: null,
                email: null,
                bio: null,
                avatarUrl: null,
                twitterUrl: null,
                githubUrl: null,
                language: "en",
                theme: "dark",
                profileVisibility: "public",
            };
        }
        return user;
    });
    app.put("/user/profile/:userId", {
        preHandler: [requireSession],
    }, async (request, reply) => {
        const params = z
            .object({ userId: z.string().min(1) })
            .parse(request.params);
        const body = z
            .object({
            displayName: z.string().min(2).max(80).optional(),
            email: z.string().email().optional(),
            bio: z.string().max(500).optional(),
            avatarUrl: z.string().url().max(500).optional(),
            twitterUrl: z.string().url().max(200).optional(),
            githubUrl: z.string().url().max(200).optional(),
            language: z.enum(["en", "pt-BR", "es"]).optional(),
            theme: z.enum(["light", "dark", "system"]).optional(),
            profileVisibility: visibility.optional(),
        })
            .parse(request.body);
        if (params.userId !== request.session.userId) {
            return reply.code(403).send({ error: "Forbidden" });
        }
        const updated = await prisma.user.update({
            where: { id: request.session.userId },
            data: {
                ...(body.displayName !== undefined
                    ? { displayName: body.displayName }
                    : {}),
                ...(body.email !== undefined ? { email: body.email } : {}),
                ...(body.bio !== undefined ? { bio: body.bio } : {}),
                ...(body.avatarUrl !== undefined
                    ? { avatarUrl: body.avatarUrl }
                    : {}),
                ...(body.twitterUrl !== undefined
                    ? { twitterUrl: body.twitterUrl }
                    : {}),
                ...(body.githubUrl !== undefined
                    ? { githubUrl: body.githubUrl }
                    : {}),
                ...(body.language !== undefined ? { language: body.language } : {}),
                ...(body.theme !== undefined ? { theme: body.theme } : {}),
                ...(body.profileVisibility !== undefined
                    ? { profileVisibility: body.profileVisibility }
                    : {}),
            },
            select: {
                id: true,
                username: true,
                displayName: true,
                email: true,
                bio: true,
                avatarUrl: true,
                twitterUrl: true,
                githubUrl: true,
                language: true,
                theme: true,
                profileVisibility: true,
            },
        });
        return updated;
    });
    app.post("/user/export", {
        preHandler: [requireSession],
    }, async (request) => {
        const resolvedUserId = request.session.userId;
        const requestId = randomUUID();
        await prisma.activityFeed.create({
            data: {
                userId: resolvedUserId,
                kind: "data-export-requested",
                message: "User requested personal data export",
                metadata: JSON.stringify({ requestId }),
            },
        });
        return {
            status: "accepted",
            requestId,
            message: "Export request accepted. A download bundle will be generated asynchronously.",
        };
    });
}
