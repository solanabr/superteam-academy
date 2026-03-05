import { prisma } from "./prisma.js";
export async function resolveUserId(inputUserId) {
    const normalized = inputUserId.trim();
    const userById = await prisma.user.findUnique({
        where: { id: normalized },
        select: { id: true },
    });
    if (userById) {
        return userById.id;
    }
    const userByUsername = await prisma.user.findUnique({
        where: { username: normalized },
        select: { id: true },
    });
    if (userByUsername) {
        return userByUsername.id;
    }
    const userByEmail = await prisma.user.findUnique({
        where: { email: normalized },
        select: { id: true },
    });
    if (userByEmail) {
        return userByEmail.id;
    }
    const wallet = await prisma.walletLink.findUnique({
        where: { address: normalized },
        select: { userId: true },
    });
    if (wallet) {
        return wallet.userId;
    }
    throw Object.assign(new Error("User not found"), { statusCode: 404 });
}
