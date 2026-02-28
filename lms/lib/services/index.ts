import type { LearningProgressService } from "./types";
import { ApiService } from "./api.service";

let service: LearningProgressService | null = null;

export function getService(): LearningProgressService {
  if (!service) {
    service = new ApiService();
  }
  return service;
}

export type { LearningProgressService };
