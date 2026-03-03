/**
 * Prisma client singleton — safe for Next.js hot-reload.
 * Uses Prisma v7 driver adapter (@prisma/adapter-pg) for PostgreSQL.
 * Supabase client continues handling auth, RLS, and simple CRUD.
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL ?? '';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({
        adapter,
        log:
            process.env.NODE_ENV === 'development'
                ? ['error', 'warn']
                : ['error'],
    });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
