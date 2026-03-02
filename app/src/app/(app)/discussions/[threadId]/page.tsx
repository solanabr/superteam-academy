"use client";

import { use, useCallback } from "react";
import { useThreadDetail } from "@/lib/hooks/use-thread-detail";
import { ThreadDetailView } from "@/components/discussions/thread-detail";
import { Loader2 } from "lucide-react";

export default function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = use(params);
  const {
    thread,
    isLoading,
    addComment,
    editComment,
    deleteComment,
    voteThread,
    voteComment,
  } = useThreadDetail(threadId);

  const handleAddComment = useCallback(
    (body: string, parentId?: string) => {
      addComment({ body, parentId });
    },
    [addComment],
  );

  if (isLoading || !thread) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <ThreadDetailView
        thread={thread}
        isLoading={isLoading}
        onVoteThread={voteThread}
        onVoteComment={voteComment}
        onAddComment={handleAddComment}
        onEditComment={editComment}
        onDeleteComment={deleteComment}
      />
    </div>
  );
}
