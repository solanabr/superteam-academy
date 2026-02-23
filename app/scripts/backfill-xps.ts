import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching all users with progress...');
    const progresses = await prisma.progress.findMany();

    console.log(`Found ${progresses.length} progress records.`);

    if (progresses.length === 0) {
        console.log('Nothing to backfill.');
        return;
    }

    // Create an XpEvent for each existing progress XP
    let createdCount = 0;
    for (const p of progresses) {
        if (p.xp > 0) {
            await prisma.xpEvent.create({
                data: {
                    userId: p.userId,
                    amount: p.xp,
                    source: 'backfill',
                    createdAt: p.updatedAt, // Map backfill to their last interaction
                }
            });
            createdCount++;
        }
    }

    console.log(`Successfully created ${createdCount} XpEvents for backfill.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
