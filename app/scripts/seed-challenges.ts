import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Seeding Daily Challenges...");

    const challenges = [
        {
            title: "First steps of the day",
            description: "Complete your first lesson today.",
            xpReward: 25,
            targetCount: 1,
            type: "LESSON_COUNT",
            isActive: true
        },
        {
            title: "Knowledge Seeker",
            description: "Complete 3 lessons in a single day.",
            xpReward: 50,
            targetCount: 3,
            type: "LESSON_COUNT",
            isActive: true
        }
    ];

    for (const c of challenges) {
        // Ищем по title
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