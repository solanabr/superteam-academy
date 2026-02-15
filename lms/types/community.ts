export type ThreadType = "discussion" | "question";

export interface Thread {
  _id: string;
  author: string;
  authorName: string;
  title: string;
  body: string;
  type: ThreadType;
  tags: string[];
  views: number;
  upvotes: string[];
  isPinned: boolean;
  isSolved: boolean;
  solvedReplyId: string | null;
  replyCount: number;
  txHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Reply {
  _id: string;
  threadId: string;
  author: string;
  authorName: string;
  body: string;
  upvotes: string[];
  txHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Endorsement {
  _id: string;
  endorser: string;
  endorsee: string;
  message: string | null;
  txHash: string | null;
  createdAt: string;
}

export interface CommunityStats {
  communityPoints: number;
  endorsementCount: number;
}
