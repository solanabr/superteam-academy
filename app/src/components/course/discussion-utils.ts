/** Shared types, constants, and utilities for the discussion section. */

import {
  getUserDisplayName,
  formatRelativeDate,
} from "@/lib/utils";

/** A single comment in a discussion thread. */
export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  isUser?: boolean;
  replies: Comment[];
}

/** Props for DiscussionSection. */
export interface DiscussionSectionProps {
  courseSlug: string;
}

const STORAGE_KEY_PREFIX = "sta_discussions:";

/** Generate a unique ID for a comment. */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Read the current user's display name from localStorage. Re-exports shared utility. */
export const getUserName = getUserDisplayName;

/** Format a comment date as a relative timestamp. Re-exports shared utility. */
export const formatCommentDate = formatRelativeDate;

/** Seed comments shown when no localStorage data exists. */
export const SEED_COMMENTS: Comment[] = [
  {
    id: "seed-1",
    author: "Lucas Oliveira",
    content:
      "The section on PDAs was really eye-opening. Does anyone know if there's a limit on how many PDAs a single program can derive?",
    createdAt: "2026-02-18T14:30:00Z",
    replies: [
      {
        id: "seed-1r1",
        author: "Ana Santos",
        content:
          "There's no hard limit on the number of PDAs — they're derived deterministically from seeds, so you can create as many as you need. The main constraint is compute budget per transaction.",
        createdAt: "2026-02-18T15:45:00Z",
        replies: [],
      },
      {
        id: "seed-1r2",
        author: "Pedro Martinez",
        content:
          "Ana is right. Also worth noting that each PDA has a minimum rent-exempt balance, so there's an economic cost to creating many accounts.",
        createdAt: "2026-02-18T16:20:00Z",
        replies: [],
      },
    ],
  },
  {
    id: "seed-2",
    author: "Sofia Ribeiro",
    content:
      "Tip for anyone stuck on Challenge 3: make sure your account discriminator matches what Anchor expects. I spent an hour debugging before I realized I had the wrong 8-byte prefix.",
    createdAt: "2026-02-16T09:15:00Z",
    replies: [
      {
        id: "seed-2r1",
        author: "Marco Ferreira",
        content:
          "Thanks for this! I was hitting the exact same issue. The discriminator is the first 8 bytes of the SHA-256 hash of the account name.",
        createdAt: "2026-02-16T10:00:00Z",
        replies: [],
      },
    ],
  },
  {
    id: "seed-3",
    author: "Isabella Chen",
    content:
      "Loving the gamification in this course! The XP system really keeps me motivated to complete lessons daily. Anyone else on a streak?",
    createdAt: "2026-02-14T11:00:00Z",
    replies: [],
  },
];

/** Load comments from localStorage with seed fallback. */
export function loadComments(courseSlug: string): Comment[] {
  if (typeof window === "undefined") return SEED_COMMENTS;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${courseSlug}`);
    if (raw) {
      const parsed = JSON.parse(raw) as Comment[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return SEED_COMMENTS;
}

/** Save comments to localStorage. */
export function saveComments(courseSlug: string, comments: Comment[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `${STORAGE_KEY_PREFIX}${courseSlug}`,
    JSON.stringify(comments)
  );
}

/** Count all comments including nested replies. */
export function countComments(comments: Comment[]): number {
  return comments.reduce(
    (sum, c) => sum + 1 + countComments(c.replies),
    0
  );
}
