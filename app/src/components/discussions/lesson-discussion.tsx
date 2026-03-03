"use client";

import { useMemo } from "react";
import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLessonDiscussion } from "@/lib/hooks/use-lesson-discussion";
import { CommentTree } from "./comment-tree";
import { CommentComposer } from "./comment-composer";

interface LessonDiscussionProps {
  lessonId: string;
  courseId: string;
  currentUserId?: string | null;
}

export function LessonDiscussion({
  lessonId,
  courseId,
  currentUserId,
}: LessonDiscussionProps) {
  const t = useTranslations("discussions");
  const {
    thread,
    isLoading,
    commentCount,
    addComment,
    voteComment,
    deleteComment,
  } = useLessonDiscussion(lessonId, courseId);

  const comments = useMemo(() => thread?.comments ?? [], [thread?.comments]);

  function handleNewComment(body: string) {
    addComment({ body });
  }

  function handleReply(parentId: string, body: string) {
    addComment({ body, parentId });
  }

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-heading text-xl font-bold">{t("lessonTitle")}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("commentsCount", { count: commentCount })}
      </p>

      <div className="mt-6">
        <CommentComposer
          onSubmit={handleNewComment}
          placeholder={t("lessonPlaceholder")}
        />
      </div>

      <div className="mt-6">
        <CommentTree
          comments={comments}
          currentUserId={currentUserId}
          onReply={handleReply}
          onEdit={() => {}} // Lesson discussions: edit not shown (simplified)
          onDelete={deleteComment}
          onVote={(commentId, value) => voteComment(commentId, value)}
        />
      </div>

      {comments.length === 0 && !isLoading && (
        <div className="mt-8 text-center">
          <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-2 text-sm text-muted-foreground">
            {t("noComments")}
          </p>
          <p className="text-xs text-muted-foreground">{t("beFirst")}</p>
        </div>
      )}
    </div>
  );
}
