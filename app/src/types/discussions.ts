export type ThreadScope = "community" | "lesson";
export type ThreadCategory = "Help" | "Show & Tell" | "Ideas" | "General";
export type VoteValue = 1 | -1 | 0;

export interface ThreadAuthor {
  id: string;
  displayName: string;
  image?: string | null;
}

export interface ThreadListItem {
  id: string;
  title: string;
  preview: string;
  scope: ThreadScope;
  category: ThreadCategory | null;
  tags: string[];
  author: ThreadAuthor;
  voteScore: number;
  commentCount: number;
  viewCount: number;
  userVote: VoteValue;
  isPinned: boolean;
  createdAt: string;
}

export interface ThreadDetail extends ThreadListItem {
  body: string;
  isLocked: boolean;
  updatedAt: string;
  comments: CommentNode[];
}

export interface CommentNode {
  id: string;
  parentId: string | null;
  depth: number;
  body: string;
  author: ThreadAuthor;
  voteScore: number;
  userVote: VoteValue;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateThreadPayload {
  title: string;
  body: string;
  scope: ThreadScope;
  category?: ThreadCategory;
  tags?: string[];
  lessonId?: string;
  courseId?: string;
}

export interface CreateCommentPayload {
  body: string;
  parentId?: string;
}

export interface ThreadListParams {
  scope?: ThreadScope;
  category?: ThreadCategory;
  lessonId?: string;
  sort?: "newest" | "top" | "mostCommented";
  search?: string;
  cursor?: string;
  limit?: number;
}

export interface ThreadListResponse {
  threads: ThreadListItem[];
  nextCursor: string | null;
}
