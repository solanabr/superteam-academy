function toDay(dateInput) {
    return new Date(Date.UTC(dateInput.getUTCFullYear(), dateInput.getUTCMonth(), dateInput.getUTCDate()));
}
function dayDiff(from, to) {
    const ms = toDay(to).getTime() - toDay(from).getTime();
    return Math.round(ms / (24 * 60 * 60 * 1000));
}
export async function recordStreakActivity(prisma, userId, inputDate, bonusApplied = false) {
    const activityDay = toDay(inputDate);
    const existingEvent = await prisma.streakDayEvent.findUnique({
        where: {
            userId_activityDay: {
                userId,
                activityDay,
            },
        },
    });
    // Compute new streak count before writing the event so we can auto-detect milestones
    const current = await prisma.streakState.findUnique({ where: { userId } });
    let currentDays = current?.currentDays ?? 0;
    let longestDays = current?.longestDays ?? 0;
    if (!current?.lastActiveDay) {
        currentDays = 1;
        longestDays = Math.max(longestDays, currentDays);
    }
    else {
        const diff = dayDiff(current.lastActiveDay, activityDay);
        if (diff === 0) {
            currentDays = current.currentDays;
        }
        else if (diff === 1) {
            currentDays = current.currentDays + 1;
        }
        else {
            currentDays = 1;
        }
        longestDays = Math.max(longestDays, currentDays);
    }
    // Auto-apply bonus on every 7-day milestone (7, 14, 21, ...)
    const effectiveBonus = bonusApplied || currentDays % 7 === 0;
    if (!existingEvent) {
        await prisma.streakDayEvent.create({
            data: {
                userId,
                activityDay,
                bonusApplied: effectiveBonus,
            },
        });
    }
    return prisma.streakState.upsert({
        where: { userId },
        update: {
            currentDays,
            longestDays,
            lastActiveDay: activityDay,
        },
        create: {
            userId,
            currentDays,
            longestDays,
            lastActiveDay: activityDay,
        },
    });
}
export function toStreakIsoDay(inputDate) {
    return toDay(inputDate).toISOString().slice(0, 10);
}
