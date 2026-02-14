import type { LearningProgressService } from "./types";
import { LocalStorageService } from "./local-storage.service";

let service: LearningProgressService | null = null;

export function getService(): LearningProgressService {
  if (!service) {
    service = new LocalStorageService();
  }
  return service;
}

export type { LearningProgressService };
