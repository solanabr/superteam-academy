import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireSession } from "../lib/auth-middleware.js";
export async function achievementRoutes(app) {
    app.post("/achievements/claim", {
        preHandler: [requireSession],
    }, async (request) => {
        const body = z
            .object({
            achievementTypeId: z.string().min(1),
        })
            .parse(request.body);
        const resolvedUserId = request.session.userId;
        const pending = await prisma.pendingAction.create({
            data: {
                userId: resolvedUserId,
                type: "achievement_claim",
                status: "accepted",
                achievementTypeId: body.achievementTypeId,
            },
        });
        await prisma.activityFeed.create({
            data: {
                userId: resolvedUserId,
                kind: "achievement-claim-requested",
                message: `Requested claim for achievement ${body.achievementTypeId}`,
                metadata: JSON.stringify({
                    achievementTypeId: body.achievementTypeId,
                }),
            },
        });
        return {
            status: "accepted",
            pendingBackendSigner: true,
            requestId: pending.id,
        };
    });
}
