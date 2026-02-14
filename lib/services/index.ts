import { LocalProgressService } from "@/lib/services/local-progress";
import type { LearningProgressService } from "@/lib/services/types";

let singleton: LearningProgressService | null = null;

export function getLearningProgressService(): LearningProgressService {
  if (!singleton) {
    singleton = new LocalProgressService();
  }
  return singleton;
}
