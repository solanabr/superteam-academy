export const MANAGED_TYPES = [
  "course",
  "lesson",
  "instructor",
  "learningPath",
  "achievement",
  "quest",
] as const;
export type ManagedType = (typeof MANAGED_TYPES)[number];

export interface SyncResult {
  sha: string;
  written: number;
  skipped: number;
  pruned: number;
  assetsUploaded: number;
  pendingChainDeltas: string[]; // course ids whose active_lessons mask changed
}
