"use client";

import { useMemo } from "react";
import { CommentNodeComponent } from "./comment-node";
import type { CommentNode } from "@/types";

interface CommentTreeProps {
  comments: CommentNode[];
  currentUserId?: string | null;
  onReply: (parentId: string, body: string) => void;
  onEdit: (commentId: string, body: string) => void;
  onDelete: (commentId: string) => void;
  onVote: (commentId: string, value: 1 | -1) => void;
}

export function CommentTree({ comments, currentUserId, onReply, onEdit, onDelete, onVote }: CommentTreeProps) {
  const childrenMap = useMemo(() => {
    const map = new Map<string | null, CommentNode[]>();
    for (const comment of comments) {
      const key = comment.parentId;
      const list = map.get(key) ?? [];
      list.push(comment);
      map.set(key, list);
    }
    return map;
  }, [comments]);

  function renderNode(node: CommentNode): React.ReactNode {
    const nodeChildren = childrenMap.get(node.id) ?? [];
    return (
      <CommentNodeComponent
        key={node.id}
        comment={node}
        childCount={nodeChildren.length}
        currentUserId={currentUserId}
        onReply={onReply}
        onEdit={onEdit}
        onDelete={onDelete}
        onVote={onVote}
      >
        {nodeChildren.map(renderNode)}
      </CommentNodeComponent>
    );
  }

  const rootComments = childrenMap.get(null) ?? [];

  return <div>{rootComments.map(renderNode)}</div>;
}
