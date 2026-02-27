"use client";

import { useState, useEffect, useCallback } from "react";
import { discussionApi } from "@/lib/services/discussion-api";
import type {
  ThreadDetail,
  CommentNode,
  VoteValue,
  CreateCommentPayload,
} from "@/types";

export function useThreadDetail(threadId: string) {
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchThread = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await discussionApi.getThread(threadId);
      setThread(data);
      // Record view (fire and forget)
      discussionApi.recordView(threadId).catch(() => {});
    } catch {
      // swallow
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  const addComment = useCallback(
    async (data: CreateCommentPayload): Promise<CommentNode | null> => {
      try {
        const comment = await discussionApi.createComment(threadId, data);
        setThread((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: [...prev.comments, comment],
            commentCount: prev.commentCount + 1,
          };
        });
        return comment;
      } catch {
        return null;
      }
    },
    [threadId],
  );

  const editComment = useCallback(
    async (commentId: string, body: string) => {
      try {
        await discussionApi.updateComment(threadId, commentId, body);
        setThread((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: prev.comments.map((c) =>
              c.id === commentId ? { ...c, body } : c,
            ),
          };
        });
      } catch {
        // swallow
      }
    },
    [threadId],
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      try {
        await discussionApi.deleteComment(threadId, commentId);
        setThread((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: prev.comments.map((c) =>
              c.id === commentId
                ? {
                    ...c,
                    isDeleted: true,
                    body: "[deleted]",
                    author: { id: "", displayName: "[deleted]", image: null },
                  }
                : c,
            ),
          };
        });
      } catch {
        // swallow
      }
    },
    [threadId],
  );

  const voteThread = useCallback(
    async (value: VoteValue) => {
      if (value === 0) return;
      setThread((prev) => {
        if (!prev) return prev;
        const oldVote = prev.userVote;
        const newVote: VoteValue = oldVote === value ? 0 : value;
        return {
          ...prev,
          userVote: newVote,
          voteScore: prev.voteScore + (newVote - oldVote),
        };
      });
      try {
        await discussionApi.voteThread(threadId, value);
      } catch {
        fetchThread();
      }
    },
    [threadId, fetchThread],
  );

  const voteComment = useCallback(
    async (commentId: string, value: VoteValue) => {
      if (value === 0) return;
      setThread((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: prev.comments.map((c) => {
            if (c.id !== commentId) return c;
            const oldVote = c.userVote;
            const newVote: VoteValue = oldVote === value ? 0 : value;
            return {
              ...c,
              userVote: newVote,
              voteScore: c.voteScore + (newVote - oldVote),
            };
          }),
        };
      });
      try {
        await discussionApi.voteComment(threadId, commentId, value);
      } catch {
        fetchThread();
      }
    },
    [threadId, fetchThread],
  );

  return {
    thread,
    isLoading,
    addComment,
    editComment,
    deleteComment,
    voteThread,
    voteComment,
    refresh: fetchThread,
  };
}
