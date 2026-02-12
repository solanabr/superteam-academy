'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare,
  ThumbsUp,
  Reply,
  GraduationCap,
  Send,
} from 'lucide-react';
import type { DiscussionComment, DiscussionReply } from '@/lib/mock-data';

interface DiscussionProps {
  comments: DiscussionComment[];
}

function ReplyItem({ reply }: { reply: DiscussionReply }) {
  const [upvotes, setUpvotes] = useState(reply.upvotes);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  return (
    <div className="ml-8 flex gap-3 border-l-2 border-border pl-4">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {reply.author.name
            .split(' ')
            .map((n) => n[0])
            .join('')}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{reply.author.name}</span>
          {reply.author.isProfessor && (
            <Badge variant="secondary" className="gap-1 text-xs px-1.5 py-0">
              <GraduationCap className="h-3 w-3" />
              Professor
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(reply.timestamp).toLocaleDateString()}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{reply.content}</p>
        <button
          className={`mt-1 flex items-center gap-1 text-xs ${hasUpvoted ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`}
          onClick={() => {
            setHasUpvoted(!hasUpvoted);
            setUpvotes(hasUpvoted ? upvotes - 1 : upvotes + 1);
          }}
        >
          <ThumbsUp className="h-3 w-3" />
          {upvotes}
        </button>
      </div>
    </div>
  );
}

function CommentItem({ comment }: { comment: DiscussionComment }) {
  const t = useTranslations('lessonView');
  const [upvotes, setUpvotes] = useState(comment.upvotes);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {comment.author.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{comment.author.name}</span>
            {comment.author.isProfessor && (
              <Badge variant="secondary" className="gap-1 text-xs px-1.5 py-0">
                <GraduationCap className="h-3 w-3" />
                Professor
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(comment.timestamp).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{comment.content}</p>
          <div className="mt-2 flex items-center gap-3">
            <button
              className={`flex items-center gap-1 text-xs ${hasUpvoted ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`}
              onClick={() => {
                setHasUpvoted(!hasUpvoted);
                setUpvotes(hasUpvoted ? upvotes - 1 : upvotes + 1);
              }}
            >
              <ThumbsUp className="h-3 w-3" />
              {upvotes}
            </button>
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
              onClick={() => setShowReplyInput(!showReplyInput)}
            >
              <Reply className="h-3 w-3" />
              {t('reply')}
            </button>
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies.map((reply) => (
        <ReplyItem key={reply.id} reply={reply} />
      ))}

      {/* Reply input */}
      {showReplyInput && (
        <div className="ml-8 flex gap-2 pl-4">
          <Textarea
            placeholder={t('writeReply')}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="min-h-[60px] text-sm"
          />
          <Button
            size="icon"
            variant="ghost"
            disabled={!replyText.trim()}
            onClick={() => {
              setReplyText('');
              setShowReplyInput(false);
            }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function Discussion({ comments }: DiscussionProps) {
  const t = useTranslations('lessonView');
  const [newComment, setNewComment] = useState('');

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-5 w-5" />
          {t('discussion')} ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New comment */}
        <div className="flex gap-2">
          <Textarea
            placeholder={t('addComment')}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] text-sm"
          />
          <Button
            size="icon"
            variant="solana"
            disabled={!newComment.trim()}
            onClick={() => setNewComment('')}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        {/* Comments */}
        {comments.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t('noComments')}
          </p>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
