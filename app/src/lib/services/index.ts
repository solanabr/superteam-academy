import { ApiProgressService } from "./api-progress";

/**
 * Client-side singleton service for learning progress operations.
 * Calls API routes which use Prisma on the server.
 *
 * For server-side usage (API routes, server components), import
 * PrismaProgressService directly from "./prisma-progress".
 */
export const progressService = new ApiProgressService();
