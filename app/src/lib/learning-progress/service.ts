
import { prisma } from "@/lib/db";
import { createLearningProgressService } from "@/lib/learning-progress/prisma-impl";

export const learningProgressService = createLearningProgressService(prisma);
