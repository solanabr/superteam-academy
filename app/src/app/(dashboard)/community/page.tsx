'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks';
import {
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  Search,
  Plus,
  Pin,
  MessageCircle,
  ThumbsUp,
  Eye,
  ThumbsUpIcon,
  Loader2,
  X,
  Send,
  AlertCircle,
  PartyPopper,
  Megaphone,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

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
  createdAt: string;
}

interface CommunityStats {
  totalMembers: number;
  activeUsers: number;
  totalPosts: number;
  totalReplies: number;
}

export default function CommunityPage() {
  const { user, isLoading } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [announcements, setAnnouncements] = useState<CommunityPost[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [fetching, setFetching] = useState(false);
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('Discussion');
  const [creatingPost, setCreatingPost] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCommunityData = async () => {
      setFetching(true);
      try {
        // Fetch posts
        const postsResponse = await fetch(
          `/api/community/posts?q=${searchQuery}&category=${activeTab}`
        );
        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          setPosts(postsData.posts || []);

          // Separate announcements
          const announcementPosts =
            postsData.posts?.filter((p: CommunityPost) => p.isAnnouncement) || [];
          setAnnouncements(announcementPosts);
        }

        // Fetch stats
        const statsResponse = await fetch('/api/community/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error('Error fetching community data:', error);
      } finally {
        setFetching(false);
      }
    };

    fetchCommunityData();
  }, [activeTab, searchQuery]);

  const filteredPosts = posts.filter(
    (p) => !activeTab.includes('announcements') && !p.isAnnouncement
  );

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Help: 'bg-red-500/10 text-red-600 hover:bg-red-500/20',
      Discussion: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20',
      Announcements: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20',
      Achievements: 'bg-green-500/10 text-green-600 hover:bg-green-500/20',
      'Study Groups': 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20',
    };
    return colors[category] || 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20';
  };

  const handleCreatePost = async () => {
    setPostError(null);
    setPostSuccess(false);

    if (!newPostTitle.trim()) {
      setPostError('Title is required');
      return;
    }

    if (newPostTitle.trim().length < 5) {
      setPostError('Title must be at least 5 characters');
      return;
    }

    if (!newPostContent.trim()) {
      setPostError('Content is required');
      return;
    }

    if (newPostContent.trim().length < 10) {
      setPostError('Content must be at least 10 characters');
      return;
    }

    setCreatingPost(true);

    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newPostTitle,
          content: newPostContent,
          category: newPostCategory,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setPostError(error.error || 'Failed to create post');
        return;
      }

      setPostSuccess(true);
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostCategory('Discussion');

      // Refresh posts
      const postsResponse = await fetch(`/api/community/posts?category=${activeTab}`);
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setPosts(postsData.posts || []);
      }

      setTimeout(() => {
        setShowNewPostDialog(false);
        setPostSuccess(false);
      }, 1500);
    } catch (error) {
      setPostError('An error occurred while creating the post');
      console.error('Error creating post:', error);
    } finally {
      setCreatingPost(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        const newLikedPosts = new Set(likedPosts);

        if (data.liked) {
          newLikedPosts.add(postId);
        } else {
          newLikedPosts.delete(postId);
        }

        setLikedPosts(newLikedPosts);

        // Update post likes count
        setPosts(
          posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  likes: data.liked ? p.likes + 1 : p.likes - 1,
                }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="bg-muted h-8 w-1/3 rounded" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-muted h-24 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container space-y-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Community</h1>
          <p className="text-muted-foreground mt-2">
            Connect with fellow learners and share knowledge
          </p>
        </div>
        {user && (
          <Button onClick={() => setShowNewPostDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        )}
      </div>

      {/* Community Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMembers.toLocaleString()}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              <span className="font-medium text-green-600">+12</span> this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeUsers}</div>
            <p className="text-muted-foreground mt-1 text-xs">Online right now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPosts}</div>
            <p className="text-muted-foreground mt-1 text-xs">Across all categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Replies</CardTitle>
            <MessageCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReplies.toLocaleString()}</div>
            <p className="text-muted-foreground mt-1 text-xs">Community engagement</p>
          </CardContent>
        </Card>
      </div>

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <AlertCircle className="h-5 w-5 text-purple-500" />
            Announcements
          </h2>
          <div className="space-y-3">
            {announcements.slice(0, 3).map((announcement) => (
              <Card
                key={announcement.id}
                className="border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20"
              >
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300">
                        <Megaphone className="mr-1 h-3 w-3" />
                        Announcement
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold">{announcement.title}</h3>
                    <p className="text-muted-foreground text-sm">{announcement.content}</p>
                    <div className="text-muted-foreground text-xs">
                      Posted by {announcement.author.name} • {announcement.createdAt}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Posts Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Posts</TabsTrigger>
          <TabsTrigger value="pinned">Pinned</TabsTrigger>
          <TabsTrigger value="help">Help</TabsTrigger>
          <TabsTrigger value="discussion">Discussion</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {fetching ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </CardContent>
            </Card>
          ) : filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-semibold">No posts found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPosts.map((post) => (
              <Card
                key={post.id}
                className={`cursor-pointer transition-shadow hover:shadow-md ${
                  post.isPinned ? 'border-primary/50' : ''
                }`}
                onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback>
                        {post.author.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {post.isPinned && (
                          <Badge variant="secondary" className="gap-1">
                            <Pin className="h-3 w-3" />
                            Pinned
                          </Badge>
                        )}
                        <Badge className={getCategoryColor(post.category)}>{post.category}</Badge>
                      </div>
                      <CardTitle className="hover:text-primary transition-colors">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">{post.content}</CardDescription>
                      <div className="text-muted-foreground flex items-center gap-4 pt-2 text-sm">
                        <span className="font-medium">{post.author.name}</span>
                        <span className="text-xs">Level {post.author.level}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground flex items-center gap-6 text-sm">
                    <button className="hover:text-foreground flex items-center gap-2 transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      <span>
                        {post.replies} {post.replies === 1 ? 'reply' : 'replies'}
                      </span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikePost(post.id);
                      }}
                      className={`flex items-center gap-2 transition-colors ${
                        likedPosts.has(post.id) ? 'text-red-500' : 'hover:text-foreground'
                      }`}
                    >
                      <ThumbsUpIcon
                        className="h-4 w-4"
                        fill={likedPosts.has(post.id) ? 'currentColor' : 'none'}
                      />
                      <span>{post.likes}</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span>{post.views}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Join Community CTA */}
      {!user && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Join the Community</CardTitle>
            <CardDescription>
              Sign in to post questions, share knowledge, and connect with fellow learners
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/auth/signin">Sign In to Participate</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* New Post Dialog */}
      <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create a New Post</DialogTitle>
            <DialogDescription>
              Share your thoughts, ask questions, or help fellow community members
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {postError && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-400">
                {postError}
              </div>
            )}

            {postSuccess && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/20 dark:text-green-400">
                <span className="flex items-center gap-1">
                  Post created successfully!
                  <PartyPopper className="h-4 w-4" />
                </span>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="What is your post about?"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                disabled={creatingPost}
                className="mt-1"
              />
              {newPostTitle && (
                <p className="text-muted-foreground mt-1 text-xs">
                  {newPostTitle.length} / 200 characters
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={newPostCategory}
                onChange={(e) => setNewPostCategory(e.target.value)}
                disabled={creatingPost}
                className="border-input bg-background ring-offset-background focus:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
              >
                <option value="Discussion">Discussion</option>
                <option value="Help">Help</option>
                <option value="Achievements">Achievements</option>
                <option value="Study Groups">Study Groups</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="Share your thoughts... (minimum 10 characters)"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                disabled={creatingPost}
                className="mt-1 min-h-32"
              />
              {newPostContent && (
                <p className="text-muted-foreground mt-1 text-xs">
                  {newPostContent.length} / 5000 characters
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewPostDialog(false);
                  setPostError(null);
                  setPostSuccess(false);
                }}
                disabled={creatingPost}
              >
                Cancel
              </Button>
              <Button onClick={handleCreatePost} disabled={creatingPost}>
                {creatingPost ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
