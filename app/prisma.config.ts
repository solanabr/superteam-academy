/**
 * Prisma v7 config — connection URLs moved here from schema.prisma.
 * Uses Supabase PostgreSQL pooler (port 6543) for DATABASE_URL
 * and direct connection (port 5432) for DIRECT_URL (migrations).
 */
import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load .env.local since Prisma CLI doesn't auto-load Next.js env files
dotenv.config({ path: path.join(__dirname, '.env.local') });

export default defineConfig({
    schema: path.join(__dirname, 'prisma', 'schema.prisma'),
    datasource: {
        url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
    },
});
