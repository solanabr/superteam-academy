export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
}

export type ThreadType = "question" | "discussion";

export interface Thread {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  shortId: string;
  body: string;
  type: ThreadType;
  categoryId: string | null;
  courseId: string | null;
  lessonId: string | null;
  isSolved: boolean;
  acceptedAnswerId: string | null;
  answerCount: number;
  voteScore: number;
  viewCount: number;
  isPinned: boolean;
  isLocked: boolean;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadWithAuthor extends Thread {
  author: {
    username: string;
    avatarUrl: string | null;
    level: number;
  };
  category?: ForumCategory;
  userVote?: 1 | -1 | null;
}

export interface Answer {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  isAccepted: boolean;
  voteScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnswerWithAuthor extends Answer {
  author: {
    username: string;
    avatarUrl: string | null;
    level: number;
  };
  userVote?: 1 | -1 | null;
}

export interface ThreadDetail extends ThreadWithAuthor {
  answers: AnswerWithAuthor[];
}

export type VoteValue = 1 | -1 | 0;

export interface VoteRequest {
  threadId?: string;
  answerId?: string;
  value: VoteValue;
}

export type FlagReason = "spam" | "offensive" | "off-topic" | "other";

export interface FlagRequest {
  threadId?: string;
  answerId?: string;
  reason: FlagReason;
  details?: string;
}

export interface CommunityStats {
  totalThreads: number;
  totalAnswers: number;
  acceptedAnswers: number;
  totalCommunityXp: number;
}

export type ThreadSort = "latest" | "top" | "unanswered";

export interface ThreadScope {
  categorySlug?: string;
  courseId?: string;
  lessonId?: string;
}

export interface ThreadListParams {
  scope?: ThreadScope;
  sort?: ThreadSort;
  type?: ThreadType;
  cursor?: string;
  limit?: number;
}

export interface CreateThreadRequest {
  title: string;
  body: string;
  type: ThreadType;
  categoryId?: string;
  courseId?: string;
  lessonId?: string;
}

export interface CreateAnswerRequest {
  threadId: string;
  body: string;
}
