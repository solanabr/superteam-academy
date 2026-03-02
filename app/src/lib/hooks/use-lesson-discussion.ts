"use client";

import { useState, useEffect, useCallback } from "react";
import { discussionApi } from "@/lib/services/discussion-api";
import type { ThreadDetail, CommentNode, VoteValue, CreateCommentPayload } from "@/types";

export function useLessonDiscussion(lessonId: string, courseId: string) {
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [threadId, setThreadId] = useState<string | null>(null);

  // Find existing lesson thread
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const data = await discussionApi.listThreads({ scope: "lesson", lessonId, limit: 1 });
        if (cancelled) return;
        if (data.threads.length > 0) {
          setThreadId(data.threads[0].id);
        }
      } catch {
        // swallow
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [lessonId]);

  // Load thread detail when threadId is known
  useEffect(() => {
    if (!threadId) return;
    let cancelled = false;
    async function load() {
      try {
        const data = await discussionApi.getThread(threadId!);
        if (!cancelled) setThread(data);
      } catch {
        // swallow
      }
    }
    load();
    return () => { cancelled = true; };
  }, [threadId]);

  const addComment = useCallback(async (data: CreateCommentPayload): Promise<CommentNode | null> => {
    let id = threadId;

    // Auto-create thread on first comment
    if (!id) {
      try {
        const result = await discussionApi.createThread({
          title: "Lesson Discussion",
          body: "",
          scope: "lesson",
          lessonId,
          courseId,
        });
        id = result.id;
        setThreadId(id);
      } catch {
        return null;
      }
    }

    try {
      const comment = await discussionApi.createComment(id, data);
      setThread((prev) => {
        if (!prev) {
          // Create a minimal thread shell
          return {
            id: id!,
            title: "Lesson Discussion",
            body: "",
            preview: "",
            scope: "lesson",
            category: null,
            tags: [],
            author: comment.author,
            voteScore: 0,
            commentCount: 1,
            viewCount: 0,
            userVote: 0,
            isPinned: false,
            isLocked: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            comments: [comment],
          };
        }
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
  }, [threadId, lessonId, courseId]);

  const voteComment = useCallback(async (commentId: string, value: VoteValue) => {
    if (value === 0 || !threadId) return;
    setThread((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        comments: prev.comments.map((c) => {
          if (c.id !== commentId) return c;
          const oldVote = c.userVote;
          const newVote: VoteValue = oldVote === value ? 0 : value;
          return { ...c, userVote: newVote, voteScore: c.voteScore + (newVote - oldVote) };
        }),
      };
    });
    try {
      await discussionApi.voteComment(threadId, commentId, value);
    } catch {
      // swallow
    }
  }, [threadId]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!threadId) return;
    try {
      await discussionApi.deleteComment(threadId, commentId);
      setThread((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: prev.comments.map((c) =>
            c.id === commentId
              ? { ...c, isDeleted: true, body: "[deleted]", author: { id: "", displayName: "[deleted]", image: null } }
              : c,
          ),
        };
      });
    } catch {
      // swallow
    }
  }, [threadId]);

  const commentCount = thread?.comments.filter((c) => !c.isDeleted).length ?? 0;

  return { thread, isLoading, commentCount, addComment, voteComment, deleteComment };
}
