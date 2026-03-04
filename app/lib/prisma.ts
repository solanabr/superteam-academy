import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var __communityPrisma:
    | {
        client: PrismaClient;
        url: string;
      }
    | undefined;
}

function createPrisma(url: string): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: url,
    ssl: process.env.DATABASE_URL_SSL_REJECT_UNAUTHORIZED !== "false" ? undefined : { rejectUnauthorized: false },
  });
  return new PrismaClient({ adapter }) as unknown as PrismaClient;
}

export function getCommunityPrisma(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for community (discussions).");
  }

  const cached = globalThis.__communityPrisma;
  if (cached && cached.url === url) return cached.client;

  // In dev, this avoids stale DB connections when DATABASE_URL changes.
  if (cached && cached.url !== url) {
    void cached.client.$disconnect().catch(() => {});
  }

  const client = createPrisma(url);
  globalThis.__communityPrisma = { client, url };
  return client;
}
