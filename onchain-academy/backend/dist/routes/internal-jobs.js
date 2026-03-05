import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { rebuildLeaderboardSnapshots } from "../lib/leaderboard-indexer.js";
export async function internalJobRoutes(app) {
    app.post("/internal/jobs/leaderboard/rebuild", async (request, reply) => {
        const token = request.headers["x-internal-token"];
        if (token !== env.INTERNAL_JOB_TOKEN) {
            return reply.code(401).send({ error: "Unauthorized" });
        }
        const run = await prisma.jobRun.create({
            data: {
                jobName: "leaderboard-rebuild",
                status: "running",
            },
        });
        try {
            const result = await rebuildLeaderboardSnapshots(prisma);
            await prisma.jobRun.update({
                where: { id: run.id },
                data: {
                    status: "completed",
                    finishedAt: new Date(),
                },
            });
            return {
                ok: true,
                jobRunId: run.id,
                holdersIndexed: result.holders,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown job failure";
            await prisma.jobRun.update({
                where: { id: run.id },
                data: {
                    status: "failed",
                    error: message,
                    finishedAt: new Date(),
                },
            });
            return reply.code(500).send({
                ok: false,
                jobRunId: run.id,
                error: message,
            });
        }
    });
}
