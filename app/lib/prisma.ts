import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var __communityPrisma: PrismaClient | undefined;
}

function createPrisma(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for community (discussions).");
  }
  const adapter = new PrismaPg({
    connectionString: url,
    ssl: process.env.DATABASE_URL_SSL_REJECT_UNAUTHORIZED !== "false" ? undefined : { rejectUnauthorized: false },
  });
  return new PrismaClient({ adapter }) as unknown as PrismaClient;
}

export function getCommunityPrisma(): PrismaClient {
  if (globalThis.__communityPrisma) return globalThis.__communityPrisma;
  globalThis.__communityPrisma = createPrisma();
  return globalThis.__communityPrisma;
}
