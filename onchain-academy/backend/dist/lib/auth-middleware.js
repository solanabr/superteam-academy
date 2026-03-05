import { prisma } from "./prisma.js";
export async function requireSession(request, reply) {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return reply.code(401).send({ error: "Unauthorized" });
    }
    const token = header.slice(7);
    const session = await prisma.authSession.findUnique({
        where: { sessionToken: token },
    });
    if (!session || session.expiresAt.getTime() < Date.now()) {
        return reply.code(401).send({ error: "Session expired or invalid" });
    }
    request.session = {
        userId: session.userId,
        token,
    };
}
