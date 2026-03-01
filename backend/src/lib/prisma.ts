import { PrismaClient } from "@/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrisma(): PrismaClient {
  let url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required when using Prisma (credential collections DB).");
  }
  try {
    const u = new URL(url);
    const mode = u.searchParams.get("sslmode");
    if (mode === "require" || mode === "prefer" || mode === "verify-ca") {
      u.searchParams.set("sslmode", "verify-full");
      url = u.toString();
    }
  } catch {
    // leave url unchanged
  }
  const adapter = new PrismaPg({
    connectionString: url,
    ssl: process.env.DATABASE_URL_SSL_REJECT_UNAUTHORIZED !== "false" ? undefined : { rejectUnauthorized: false },
  });
  return new PrismaClient({ adapter }) as unknown as PrismaClient;
}

export function getPrisma(): PrismaClient {
  if (globalThis.__prisma) return globalThis.__prisma;
  globalThis.__prisma = createPrisma();
  return globalThis.__prisma;
}
