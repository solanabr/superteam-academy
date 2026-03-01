"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link } from "@/i18n/routing";
import {
  MessageSquare,
  ThumbsUp,
  Clock,
  Plus,
  Search,
  LogIn,
  HelpCircle,
  MessagesSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { COURSE_CARDS } from "@/lib/mock-data";
import type { PostType, PostLiker } from "@/services/interfaces";

interface Post {
  id: string;
  author: string;
  authorUsername: string | null;
  authorAvatarUrl: string | null;
  title: string;
  content: string;
  courseId: string | null;
  type: PostType;
  tags: string[];
  upvotes: number;
  replies: number;
  liked: boolean;
  createdAt: string;
}

const TYPE_CONFIG: Record<PostType, { color: string; icon: typeof FileText }> = {
  question: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: HelpCircle },
  discussion: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: MessagesSquare },
  post: { color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300", icon: FileText },
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function LikersPopover({ postId, upvotes, liked, onLike, t }: {
  postId: string;
  upvotes: number;
  liked: boolean;
  onLike: (id: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const [likers, setLikers] = useState<PostLiker[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function fetchLikers() {
    if (upvotes === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/community/${postId}/likers`);
      if (res.ok) setLikers(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${liked ? "text-primary" : ""}`}
        onClick={() => onLike(postId)}
      >
        <ThumbsUp className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
      </Button>
      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) fetchLikers(); }}>
        <PopoverTrigger asChild>
          <button className="text-sm font-medium hover:underline cursor-pointer">
            {upvotes}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="start">
          <p className="text-xs font-medium mb-2">{t("likedBy")}</p>
          {upvotes === 0 ? (
            <p className="text-xs text-muted-foreground">{t("noLikesYet")}</p>
          ) : loading ? (
            <div className="space-y-2">
              {Array.from({ length: Math.min(3, upvotes) }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {likers.map((liker) => (
                <div key={liker.userId} className="flex items-center gap-2">
                  <Avatar size="sm">
                    {liker.avatarUrl && <AvatarImage src={liker.avatarUrl} alt={liker.displayName} />}
                    <AvatarFallback>{getInitials(liker.displayName)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs truncate">
                    {liker.displayName}
                    {liker.username && <span className="text-muted-foreground"> @{liker.username}</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function CommunityPage() {
  const t = useTranslations("community");
  const tc = useTranslations("common");
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filters
  const [sort, setSort] = useState<"newest" | "oldest" | "popular">("newest");
  const ALL = "__all__";
  const [filterType, setFilterType] = useState(ALL);
  const [filterCourse, setFilterCourse] = useState(ALL);
  const [filterTag, setFilterTag] = useState(ALL);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Dialog state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<PostType>("post");
  const [newCourseId, setNewCourseId] = useState(ALL);
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Handle query params for auto-open
  useEffect(() => {
    const isNew = searchParams.get("new");
    const courseSlug = searchParams.get("course");
    if (isNew === "true") {
      setDialogOpen(true);
      setNewType("question");
      if (courseSlug) {
        const course = COURSE_CARDS.find((c) => c.slug === courseSlug);
        if (course) {
          setNewCourseId(course.slug);
          setNewTags([course.title]);
        }
      }
      window.history.replaceState(null, "", pathname);
    }
  }, [searchParams, pathname]);

  // Fetch tags for autocomplete
  useEffect(() => {
    fetch("/api/community/tags")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setAllTags(data); })
      .catch(() => {});
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (search) params.set("search", search);
    if (filterType !== ALL) params.set("type", filterType);
    if (filterCourse !== ALL) params.set("courseId", filterCourse);
    if (filterTag !== ALL) params.set("tag", filterTag);

    try {
      const res = await fetch(`/api/community?${params}`);
      const data = await res.json();
      setPosts(data.posts ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setPosts([]);
      setTotal(0);
    }
    setLoading(false);
  }, [sort, page, search, filterType, filterCourse, filterTag]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [sort, filterType, filterCourse, filterTag, search]);

  async function handleLike(postId: string) {
    if (!session?.user) return;
    const res = await fetch(`/api/community/${postId}/like`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, liked: data.liked, upvotes: data.upvotes } : p,
        ),
      );
    }
  }

  async function handleSubmit() {
    if (!newContent.trim()) return;
    // Flush any pending tag from the input
    const finalTags = [...newTags];
    if (tagInput.trim()) {
      const pending = tagInput.trim().toLowerCase();
      if (!finalTags.includes(pending)) {
        finalTags.push(pending);
      }
    }
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        content: newContent,
        courseId: newCourseId !== ALL ? newCourseId : undefined,
        type: newType,
        tags: finalTags,
      }),
    });
    if (res.ok) {
      setNewTitle("");
      setNewContent("");
      setNewType("post");
      setNewCourseId(ALL);
      setNewTags([]);
      setTagInput("");
      setDialogOpen(false);
      fetchPosts();
    }
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (!newTags.includes(tag)) {
        setNewTags([...newTags, tag]);
      }
      setTagInput("");
      setTagSuggestions([]);
    }
  }

  function handleTagInputChange(value: string) {
    setTagInput(value);
    if (value.trim()) {
      setTagSuggestions(
        allTags.filter((t) => t.toLowerCase().includes(value.toLowerCase()) && !newTags.includes(t)).slice(0, 5),
      );
    } else {
      setTagSuggestions([]);
    }
  }

  function addTagSuggestion(tag: string) {
    if (!newTags.includes(tag)) {
      setNewTags([...newTags, tag]);
    }
    setTagInput("");
    setTagSuggestions([]);
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        {session?.user ? (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t("startThread")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("startThread")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Type selector */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{t("postType")}</label>
                  <div className="flex gap-2">
                    {(["post", "question", "discussion"] as PostType[]).map((type) => {
                      const Icon = TYPE_CONFIG[type].icon;
                      return (
                        <Button
                          key={type}
                          type="button"
                          variant={newType === type ? "default" : "outline"}
                          size="sm"
                          className="gap-1.5"
                          onClick={() => setNewType(type)}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {t(type)}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <Input
                  placeholder={t("postTitle")}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <Textarea
                  placeholder={t("writePost")}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={5}
                />

                {/* Course selector */}
                <div className="w-full">
                  <Select value={newCourseId} onValueChange={setNewCourseId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("selectCourse")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>{t("selectCourse")}</SelectItem>
                      {COURSE_CARDS.map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags input */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{t("addTags")}</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {newTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button type="button" onClick={() => setNewTags(newTags.filter((t) => t !== tag))}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="relative">
                    <Input
                      placeholder={t("tagPlaceholder")}
                      value={tagInput}
                      onChange={(e) => handleTagInputChange(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                    />
                    {tagSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
                        {tagSuggestions.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                            onClick={() => addTagSuggestion(tag)}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button className="w-full" onClick={handleSubmit}>
                  {tc("submit")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Link href="/auth/signin">
            <Button variant="outline" className="gap-2">
              <LogIn className="h-4 w-4" />
              {tc("signIn")}
            </Button>
          </Link>
        )}
      </div>

      {!session?.user && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <LogIn className="h-4 w-4 shrink-0" />
          <span>
            <Link href="/auth/signin" className="font-medium text-primary hover:underline">
              {tc("signIn")}
            </Link>
            {" "}to create posts, reply, and like discussions.
          </span>
        </div>
      )}

      {/* Search + Filters */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={tc("search") + "..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Sort */}
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t("sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("newest")}</SelectItem>
              <SelectItem value="oldest">{t("oldest")}</SelectItem>
              <SelectItem value="popular">{t("mostPopular")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Type filter */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t("allTypes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("allTypes")}</SelectItem>
              <SelectItem value="question">{t("question")}</SelectItem>
              <SelectItem value="discussion">{t("discussion")}</SelectItem>
              <SelectItem value="post">{t("post")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Course filter */}
          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t("allCourses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("allCourses")}</SelectItem>
              {COURSE_CARDS.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tag filter */}
          {allTags.length > 0 && (
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t("searchByTag")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("allTags")}</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Post list */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-4 w-6" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-3 text-muted-foreground">
                {search || filterType !== ALL || filterCourse !== ALL || filterTag !== ALL ? t("noResults") : t("noPostsYet")}
              </p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => {
            const typeConf = TYPE_CONFIG[post.type];
            const TypeIcon = typeConf.icon;
            return (
              <Card
                key={post.id}
                className="transition-all hover:border-primary/50 cursor-pointer"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <LikersPopover
                      postId={post.id}
                      upvotes={post.upvotes}
                      liked={post.liked}
                      onLike={handleLike}
                      t={t}
                    />

                    <Link href={`/community/${post.id}`} className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className={`text-[10px] gap-1 ${typeConf.color}`}>
                          <TypeIcon className="h-3 w-3" />
                          {t(post.type)}
                        </Badge>
                        {post.courseId && (
                          <Badge variant="outline" className="text-[10px]">
                            {COURSE_CARDS.find((c) => c.slug === post.courseId)?.title ?? post.courseId}
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold">{post.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {post.content}
                      </p>
                      {post.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {post.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px] font-normal">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Avatar size="sm">
                            {post.authorAvatarUrl && <AvatarImage src={post.authorAvatarUrl} alt={post.author} />}
                            <AvatarFallback>{getInitials(post.author)}</AvatarFallback>
                          </Avatar>
                          {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {post.replies}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("previous")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="gap-1"
          >
            {t("next")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
