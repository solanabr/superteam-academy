import { randomUUID } from "node:crypto";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireSession } from "../lib/auth-middleware.js";
import { resolveUserId } from "../lib/user-identity.js";
const nonceRequestSchema = z.object({
    walletAddress: z.string().min(32),
});
const verifyRequestSchema = z.object({
    walletAddress: z.string().min(32),
    signature: z.string().min(32),
});
const oauthBootstrapSchema = z.object({
    provider: z.enum(["google", "github"]),
    providerAccountId: z.string().min(1),
    email: z.string().email().optional(),
    displayName: z.string().min(1).max(120).optional(),
    avatarUrl: z.string().url().optional(),
    linkSessionToken: z.string().min(1).optional(),
});
function buildChallengeMessage(nonce) {
    return `Superteam Academy Login\nNonce:${nonce}`;
}
function deriveUsername(walletAddress) {
    return `builder-${walletAddress.slice(0, 8).toLowerCase()}`;
}
function slugifyUsername(input) {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 24);
}
async function allocateUsername(preferredBase) {
    const base = preferredBase || "builder";
    let candidate = base;
    for (let attempt = 0; attempt < 20; attempt += 1) {
        const exists = await prisma.user.findUnique({
            where: { username: candidate },
            select: { id: true },
        });
        if (!exists) {
            return candidate;
        }
        candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    }
    return `${base}-${randomUUID().slice(0, 8)}`;
}
async function createSession(userId) {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await prisma.authSession.create({
        data: {
            userId,
            sessionToken: token,
            expiresAt,
        },
    });
    return { token, expiresAt };
}
async function findUserIdBySessionToken(token) {
    if (!token) {
        return null;
    }
    const session = await prisma.authSession.findUnique({
        where: { sessionToken: token },
        select: { userId: true, expiresAt: true },
    });
    if (!session || session.expiresAt.getTime() < Date.now()) {
        return null;
    }
    return session.userId;
}
async function resolveOauthUser(params) {
    const linkedBySessionUserId = await findUserIdBySessionToken(params.linkSessionToken);
    if (linkedBySessionUserId) {
        const existingProviderOwner = await prisma.authProviderLink.findUnique({
            where: {
                provider_providerAccountId: {
                    provider: params.provider,
                    providerAccountId: params.providerAccountId,
                },
            },
            select: { userId: true },
        });
        if (existingProviderOwner &&
            existingProviderOwner.userId !== linkedBySessionUserId) {
            throw Object.assign(new Error("OAuth provider already linked"), {
                statusCode: 409,
            });
        }
        await prisma.authProviderLink.upsert({
            where: {
                provider_providerAccountId: {
                    provider: params.provider,
                    providerAccountId: params.providerAccountId,
                },
            },
            update: { userId: linkedBySessionUserId },
            create: {
                userId: linkedBySessionUserId,
                provider: params.provider,
                providerAccountId: params.providerAccountId,
            },
        });
        if (params.email) {
            await prisma.user.update({
                where: { id: linkedBySessionUserId },
                data: {
                    email: params.email,
                    ...(params.displayName ? { displayName: params.displayName } : {}),
                    ...(params.avatarUrl ? { avatarUrl: params.avatarUrl } : {}),
                },
            });
        }
        else if (params.displayName || params.avatarUrl) {
            await prisma.user.update({
                where: { id: linkedBySessionUserId },
                data: {
                    ...(params.displayName ? { displayName: params.displayName } : {}),
                    ...(params.avatarUrl ? { avatarUrl: params.avatarUrl } : {}),
                },
            });
        }
        const linkedUser = await prisma.user.findUniqueOrThrow({
            where: { id: linkedBySessionUserId },
            select: { id: true, username: true, displayName: true },
        });
        return {
            user: linkedUser,
            linked: true,
            linkedBySession: true,
        };
    }
    const existingProviderLink = await prisma.authProviderLink.findUnique({
        where: {
            provider_providerAccountId: {
                provider: params.provider,
                providerAccountId: params.providerAccountId,
            },
        },
        include: {
            user: {
                select: { id: true, username: true, displayName: true },
            },
        },
    });
    if (existingProviderLink) {
        return {
            user: existingProviderLink.user,
            linked: true,
            linkedBySession: false,
        };
    }
    let userId = null;
    if (params.email) {
        const existingByEmail = await prisma.user.findUnique({
            where: { email: params.email },
            select: { id: true },
        });
        userId = existingByEmail?.id ?? null;
    }
    if (!userId) {
        const suggestedBase = params.email
            ? slugifyUsername(params.email.split("@")[0] ?? "")
            : slugifyUsername(params.displayName ?? "");
        const username = await allocateUsername(suggestedBase || "builder");
        const created = await prisma.user.create({
            data: {
                username,
                displayName: params.displayName ?? username,
                ...(params.email ? { email: params.email } : {}),
                ...(params.avatarUrl ? { avatarUrl: params.avatarUrl } : {}),
                language: "en",
                theme: "dark",
            },
            select: { id: true },
        });
        userId = created.id;
    }
    else if (params.displayName || params.avatarUrl) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                ...(params.displayName ? { displayName: params.displayName } : {}),
                ...(params.avatarUrl ? { avatarUrl: params.avatarUrl } : {}),
            },
        });
    }
    await prisma.authProviderLink.upsert({
        where: {
            provider_providerAccountId: {
                provider: params.provider,
                providerAccountId: params.providerAccountId,
            },
        },
        update: { userId },
        create: {
            userId,
            provider: params.provider,
            providerAccountId: params.providerAccountId,
        },
    });
    const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { id: true, username: true, displayName: true },
    });
    return {
        user,
        linked: true,
        linkedBySession: false,
    };
}
export async function authRoutes(app) {
    app.post("/auth/wallet/nonce", async (request, reply) => {
        const body = nonceRequestSchema.parse(request.body);
        const nonce = randomUUID();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await prisma.nonceChallenge.upsert({
            where: { walletAddress: body.walletAddress },
            update: { nonce, expiresAt },
            create: { walletAddress: body.walletAddress, nonce, expiresAt },
        });
        return reply.send({
            walletAddress: body.walletAddress,
            nonce,
            message: buildChallengeMessage(nonce),
            expiresAt: expiresAt.toISOString(),
        });
    });
    app.post("/auth/wallet/verify", async (request, reply) => {
        const body = verifyRequestSchema.parse(request.body);
        const challenge = await prisma.nonceChallenge.findUnique({
            where: { walletAddress: body.walletAddress },
        });
        if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
            return reply.code(400).send({ error: "Nonce expired or missing" });
        }
        const message = new TextEncoder().encode(buildChallengeMessage(challenge.nonce));
        const signature = bs58.decode(body.signature);
        const publicKey = bs58.decode(body.walletAddress);
        const verified = nacl.sign.detached.verify(message, signature, publicKey);
        if (!verified) {
            return reply.code(401).send({ error: "Invalid signature" });
        }
        const username = deriveUsername(body.walletAddress);
        const user = await prisma.user.upsert({
            where: { username },
            update: { updatedAt: new Date() },
            create: {
                username,
                displayName: `Builder ${body.walletAddress.slice(0, 4)}`,
                language: "en",
                theme: "dark",
            },
        });
        await prisma.walletLink.upsert({
            where: { address: body.walletAddress },
            update: { userId: user.id, isPrimary: true },
            create: {
                userId: user.id,
                address: body.walletAddress,
                isPrimary: true,
            },
        });
        await prisma.nonceChallenge.delete({
            where: { walletAddress: body.walletAddress },
        });
        const session = await createSession(user.id);
        return reply.send({
            token: session.token,
            expiresAt: session.expiresAt.toISOString(),
            user: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
            },
        });
    });
    app.post("/auth/oauth/bootstrap", async (request, reply) => {
        const body = oauthBootstrapSchema.parse(request.body);
        try {
            const resolved = await resolveOauthUser({
                provider: body.provider,
                providerAccountId: body.providerAccountId,
                ...(body.email ? { email: body.email } : {}),
                ...(body.displayName ? { displayName: body.displayName } : {}),
                ...(body.avatarUrl ? { avatarUrl: body.avatarUrl } : {}),
                ...(body.linkSessionToken
                    ? { linkSessionToken: body.linkSessionToken }
                    : {}),
            });
            const session = await createSession(resolved.user.id);
            return reply.send({
                token: session.token,
                expiresAt: session.expiresAt.toISOString(),
                linked: resolved.linked,
                linkedBySession: resolved.linkedBySession,
                user: resolved.user,
            });
        }
        catch (error) {
            const statusCode = typeof error.statusCode === "number"
                ? error.statusCode
                : 500;
            const message = error instanceof Error ? error.message : "OAuth bootstrap failed";
            return reply.code(statusCode).send({ error: message });
        }
    });
    const linkWalletHandler = async (request, reply) => {
        const body = z
            .object({
            walletAddress: z.string().min(32),
            isPrimary: z.boolean().default(false),
        })
            .parse(request.body);
        const resolvedUserId = request.session.userId;
        const existing = await prisma.walletLink.findUnique({
            where: { address: body.walletAddress },
        });
        if (existing && existing.userId !== resolvedUserId) {
            return reply
                .code(409)
                .send({ error: "Wallet already linked to another account" });
        }
        if (body.isPrimary) {
            await prisma.walletLink.updateMany({
                where: { userId: resolvedUserId },
                data: { isPrimary: false },
            });
        }
        const wallet = await prisma.walletLink.upsert({
            where: { address: body.walletAddress },
            update: { userId: resolvedUserId, isPrimary: body.isPrimary },
            create: {
                userId: resolvedUserId,
                address: body.walletAddress,
                isPrimary: body.isPrimary,
            },
        });
        return {
            linked: true,
            wallet,
        };
    };
    const linkOauthHandler = async (request, reply) => {
        const body = z
            .object({
            provider: z.enum(["google", "github"]),
            providerAccountId: z.string().min(1),
        })
            .parse(request.body);
        const resolvedUserId = request.session.userId;
        const existing = await prisma.authProviderLink.findUnique({
            where: {
                provider_providerAccountId: {
                    provider: body.provider,
                    providerAccountId: body.providerAccountId,
                },
            },
        });
        if (existing && existing.userId !== resolvedUserId) {
            return reply
                .code(409)
                .send({ error: "OAuth provider already linked to another account" });
        }
        const account = await prisma.authProviderLink.upsert({
            where: {
                provider_providerAccountId: {
                    provider: body.provider,
                    providerAccountId: body.providerAccountId,
                },
            },
            update: { userId: resolvedUserId },
            create: {
                userId: resolvedUserId,
                provider: body.provider,
                providerAccountId: body.providerAccountId,
            },
        });
        return {
            linked: true,
            account,
        };
    };
    app.post("/auth/account/link-wallet", {
        preHandler: [requireSession],
    }, linkWalletHandler);
    app.post("/auth/account/link-oauth", {
        preHandler: [requireSession],
    }, linkOauthHandler);
    app.get("/auth/account/links/:userId", async (request) => {
        const params = z
            .object({ userId: z.string().min(1) })
            .parse(request.params);
        const resolvedUserId = await resolveUserId(params.userId);
        const [wallets, providers] = await Promise.all([
            prisma.walletLink.findMany({
                where: { userId: resolvedUserId },
                orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
            }),
            prisma.authProviderLink.findMany({
                where: { userId: resolvedUserId },
                orderBy: { createdAt: "asc" },
            }),
        ]);
        return {
            userId: resolvedUserId,
            wallets: wallets.map((wallet) => ({
                address: wallet.address,
                isPrimary: wallet.isPrimary,
            })),
            providers: providers.map((provider) => ({
                provider: provider.provider,
                providerAccountId: provider.providerAccountId,
            })),
        };
    });
    // Backward-compatible endpoints
    app.post("/account/link-wallet", {
        preHandler: [requireSession],
    }, linkWalletHandler);
    app.post("/account/link-oauth", {
        preHandler: [requireSession],
    }, linkOauthHandler);
}
