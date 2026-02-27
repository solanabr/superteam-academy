'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks';
import {
  ArrowLeft,
  Clock,
  MessageCircle,
  ThumbsUpIcon,
  Eye,
  Send,
  Loader2,
  AlertCircle,
  Pin,
} from 'lucide-react';

interface PostComment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    level: number;
  };
  likes: number;
  createdAt: string;
}

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    level: number;
  };
  category: string;
  replies: number;
  likes: number;
  views: number;
  isPinned?: boolean;
  isAnnouncement?: boolean;
  comments: PostComment[];
  createdAt: string;
}

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { user, isLoading: authLoading } = useAuth();

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/community/posts/${postId}`);

        if (!response.ok) {
          throw new Error('Failed to load post');
        }

        const data = await response.json();
        setPost(data);

        // Check if user liked this post
        if (user) {
          const likeResponse = await fetch(`/api/community/posts/${postId}/like`);
          if (likeResponse.ok) {
            const likeData = await likeResponse.json();
            setLiked(likeData.liked);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId, user]);

  const handleSubmitComment = async () => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    if (!commentText.trim()) {
      setCommentError('Comment cannot be empty');
      return;
    }

    if (commentText.trim().length < 2) {
      setCommentError('Comment must be at least 2 characters');
      return;
    }

    setSubmittingComment(true);
    setCommentError(null);

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post comment');
      }

      const data = await response.json();

      // Add new comment to post
      if (post) {
        setPost({
          ...post,
          comments: [data.comment, ...post.comments],
          replies: post.replies + 1,
        });
      }

      setCommentText('');
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikePost = async () => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    try {
      const response = await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);

        if (post) {
          setPost({
            ...post,
            likes: data.liked ? post.likes + 1 : post.likes - 1,
          });
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments/${commentId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        const newLikedComments = new Set(likedComments);

        if (data.liked) {
          newLikedComments.add(commentId);
        } else {
          newLikedComments.delete(commentId);
        }

        setLikedComments(newLikedComments);

        if (post) {
          setPost({
            ...post,
            comments: post.comments.map((c) =>
              c.id === commentId
                ? {
                    ...c,
                    likes: data.liked ? c.likes + 1 : c.likes - 1,
                  }
                : c
            ),
          });
        }
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="bg-muted h-12 w-2/3 rounded" />
          <div className="bg-muted h-24 rounded" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container py-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="mt-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              Error Loading Post
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 dark:text-red-300">
              {error || 'The post could not be found'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Community
      </Button>

      {/* Post Content */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex flex-1 items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.author.avatar} />
                <AvatarFallback>
                  {post.author.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge
                    className={
                      post.category === 'Help'
                        ? 'bg-red-500/10 text-red-600'
                        : post.category === 'Discussion'
                          ? 'bg-blue-500/10 text-blue-600'
                          : post.category === 'Announcements'
                            ? 'bg-purple-500/10 text-purple-600'
                            : post.category === 'Achievements'
                              ? 'bg-green-500/10 text-green-600'
                              : 'bg-orange-500/10 text-orange-600'
                    }
                  >
                    {post.category}
                  </Badge>
                  {post.isPinned && (
                    <Badge variant="secondary" className="gap-1">
                      <Pin className="h-3 w-3" />
                      Pinned
                    </Badge>
                  )}
                </div>
                <CardTitle>{post.title}</CardTitle>
                <div className="text-muted-foreground mt-3 flex items-center gap-4 text-sm">
                  <span className="font-medium">{post.author.name}</span>
                  <span>Level {post.author.level}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.createdAt}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-base whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Post Stats and Actions */}
          <div className="flex flex-wrap items-center gap-6 border-t pt-4">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <MessageCircle className="h-4 w-4" />
              <span>{post.replies} replies</span>
            </div>

            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4" />
              <span>{post.views} views</span>
            </div>

            <button
              onClick={handleLikePost}
              className={`flex items-center gap-2 text-sm transition-colors ${
                liked ? 'font-medium text-red-500' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ThumbsUpIcon className="h-4 w-4" fill={liked ? 'currentColor' : 'none'} />
              <span>{post.likes} likes</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Comments ({post.replies})</h3>

        {/* Comment Input */}
        {user ? (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {(user.name || user.email)
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.name || user.email || 'You'}</p>
                    <p className="text-muted-foreground text-xs">Leave a helpful comment</p>
                  </div>
                </div>

                {commentError && (
                  <div className="rounded bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/20 dark:text-red-400">
                    {commentError}
                  </div>
                )}

                <Textarea
                  placeholder="Share your thoughts..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={submittingComment}
                  className="min-h-24"
                />

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCommentText('')}
                    disabled={submittingComment}
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleSubmitComment}
                    disabled={submittingComment || !commentText.trim()}
                  >
                    {submittingComment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Post Comment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-muted-foreground mb-3 text-sm">Sign in to leave a comment</p>
              <Button asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {post.comments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <MessageCircle className="text-muted-foreground mx-auto mb-3 h-8 w-8" />
                <p className="text-muted-foreground text-sm">
                  No comments yet. Be the first to share your thoughts!
                </p>
              </CardContent>
            </Card>
          ) : (
            post.comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.author.avatar} />
                        <AvatarFallback>
                          {comment.author.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">{comment.author.name}</span>
                          <span className="text-muted-foreground text-xs">
                            Level {comment.author.level}
                          </span>
                          <span className="text-muted-foreground text-xs">{comment.createdAt}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      className={`flex items-center gap-1 text-xs transition-colors ${
                        likedComments.has(comment.id)
                          ? 'font-medium text-red-500'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <ThumbsUpIcon
                        className="h-3 w-3"
                        fill={likedComments.has(comment.id) ? 'currentColor' : 'none'}
                      />
                      {comment.likes} {comment.likes === 1 ? 'like' : 'likes'}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
