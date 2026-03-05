import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { resolveUserId } from "../lib/user-identity.js";
import { recordStreakActivity, toStreakIsoDay } from "../lib/streak.js";
import { requireSession } from "../lib/auth-middleware.js";
export async function streakRoutes(app) {
    app.get("/streak/:userId", async (request) => {
        const params = z
            .object({ userId: z.string().min(1) })
            .parse(request.params);
        const query = z
            .object({ days: z.coerce.number().min(7).max(365).default(90) })
            .parse(request.query);
        const resolvedUserId = await resolveUserId(params.userId);
        const [state, events] = await Promise.all([
            prisma.streakState.findUnique({ where: { userId: resolvedUserId } }),
            prisma.streakDayEvent.findMany({
                where: {
                    userId: resolvedUserId,
                    activityDay: {
                        gte: new Date(Date.now() - query.days * 24 * 60 * 60 * 1000),
                    },
                },
                orderBy: { activityDay: "asc" },
            }),
        ]);
        const activeMap = new Map();
        for (const event of events) {
            activeMap.set(toStreakIsoDay(event.activityDay), {
                bonusApplied: event.bonusApplied,
            });
        }
        const calendar = Array.from({ length: query.days }, (_, index) => {
            const day = new Date(Date.now() - (query.days - index - 1) * 24 * 60 * 60 * 1000);
            const date = toStreakIsoDay(day);
            const active = activeMap.get(date);
            return {
                date,
                active: Boolean(active),
                bonusApplied: active?.bonusApplied ?? false,
            };
        });
        return {
            currentDays: state?.currentDays ?? 0,
            longestDays: state?.longestDays ?? 0,
            freezesLeft: state?.freezesLeft ?? 0,
            calendar,
        };
    });
    app.post("/streak/activity", {
        preHandler: [requireSession],
    }, async (request) => {
        const body = z
            .object({
            date: z.string().datetime().optional(),
            bonusApplied: z.boolean().default(false),
        })
            .parse(request.body);
        const resolvedUserId = request.session.userId;
        const activityDay = body.date ? new Date(body.date) : new Date();
        const state = await recordStreakActivity(prisma, resolvedUserId, activityDay, body.bonusApplied);
        return {
            currentDays: state.currentDays,
            longestDays: state.longestDays,
            freezesLeft: state.freezesLeft,
            date: toStreakIsoDay(activityDay),
        };
    });
}
