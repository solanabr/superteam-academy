import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Seeding Challenges...");

    // Устанавливаем конец текущего месяца для сезонных заданий
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const challenges = [
        // Дейлики (уже были)
        { title: "First steps of the day", description: "Complete your first lesson today.", xpReward: 25, targetCount: 1, type: "LESSON_COUNT", period: "DAILY", isActive: true },
        { title: "Knowledge Seeker", description: "Complete 3 lessons in a single day.", xpReward: 50, targetCount: 3, type: "LESSON_COUNT", period: "DAILY", isActive: true },
        
        // НОВЫЕ: Сезонные (Месячные)
        { title: "Marathon Runner", description: "Complete 20 lessons this month.", xpReward: 500, targetCount: 20, type: "LESSON_COUNT", period: "MONTHLY", expiresAt: endOfMonth, isActive: true },
        { title: "Course Champion", description: "Complete an entire course this month.", xpReward: 1000, targetCount: 1, type: "COURSE_COMPLETED", period: "MONTHLY", expiresAt: endOfMonth, isActive: true }
    ];

    for (const c of challenges) {
        const exists = await prisma.challenge.findFirst({ where: { title: c.title } });
        if (!exists) {
            await prisma.challenge.create({ data: c });
            console.log(`Created: ${c.title}`);
        } else {
            console.log(`Exists: ${c.title}`);
        }
    }
    console.log("Done.");
}

main().finally(() => prisma.$disconnect());