"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquare, Send, Trash2, User } from "lucide-react";

const PROFILE_NAME_KEY = "st-academy:profile-name";
const PROFILE_AVATAR_KEY = "st-academy:profile-avatar";

interface ForumPost {
  id: string;
  wallet: string;
  name: string;
  avatarUrl: string | null;
  content: string;
  timestamp: string;
}

function getForumKey(courseSlug: string, lessonId: string) {
  return `st-academy:forum:${courseSlug}:${lessonId}`;
}

function loadPosts(courseSlug: string, lessonId: string): ForumPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getForumKey(courseSlug, lessonId));
    return raw ? (JSON.parse(raw) as ForumPost[]) : [];
  } catch {
    return [];
  }
}

function savePosts(courseSlug: string, lessonId: string, posts: ForumPost[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getForumKey(courseSlug, lessonId),
      JSON.stringify(posts),
    );
  } catch {
    // storage full
  }
}

function shortWallet(addr: string) {
  return addr.length > 8 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;
}

function timeAgo(iso: string, t: (key: string) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return t("justNow");
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function getProfileName(): string {
  try {
    return localStorage.getItem(PROFILE_NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

function getProfileAvatar(): string | null {
  try {
    return localStorage.getItem(PROFILE_AVATAR_KEY) || null;
  } catch {
    return null;
  }
}

export function LessonForum({
  courseSlug,
  lessonId,
}: {
  courseSlug: string;
  lessonId: string;
}) {
  const t = useTranslations("forum");
  const { publicKey } = useAuth();
  const walletAddr = publicKey?.toBase58() ?? "";

  const [posts, setPosts] = React.useState<ForumPost[]>([]);
  const [content, setContent] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [myName, setMyName] = React.useState("");
  const [myAvatar, setMyAvatar] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPosts(loadPosts(courseSlug, lessonId));
  }, [courseSlug, lessonId]);

  // Keep current user's profile in sync
  React.useEffect(() => {
    setMyName(getProfileName());
    setMyAvatar(getProfileAvatar());
    const onNameChange = () => setMyName(getProfileName());
    const onAvatarChange = () => setMyAvatar(getProfileAvatar());
    window.addEventListener("profile-name-change", onNameChange);
    window.addEventListener("profile-avatar-change", onAvatarChange);
    return () => {
      window.removeEventListener("profile-name-change", onNameChange);
      window.removeEventListener("profile-avatar-change", onAvatarChange);
    };
  }, []);

  const handleSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!content.trim() || !walletAddr) return;

      const newPost: ForumPost = {
        id: `fp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        wallet: walletAddr,
        name: getProfileName(),
        avatarUrl: getProfileAvatar(),
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      const updated = [newPost, ...posts];
      setPosts(updated);
      savePosts(courseSlug, lessonId, updated);
      setContent("");
    },
    [content, walletAddr, posts, courseSlug, lessonId],
  );

  const handleDelete = React.useCallback(
    (postId: string) => {
      const updated = posts.filter((p) => p.id !== postId);
      setPosts(updated);
      savePosts(courseSlug, lessonId, updated);
    },
    [posts, courseSlug, lessonId],
  );

  return (
    <Card className="mt-6 overflow-hidden border-2 border-primary/10 shadow-lg">
      <CardHeader
        className="cursor-pointer bg-muted/50 transition-colors hover:bg-muted/70"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {t("title")}
          </span>
          <span className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
            {posts.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {posts.length}
              </span>
            )}
            <span className="text-xs">{isOpen ? "▲" : "▼"}</span>
          </span>
        </CardTitle>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4 p-6">
          {/* New post form */}
          {walletAddr ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t("placeholder")}
                  rows={2}
                  className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!content.trim()}
                  className="shrink-0 self-end bg-[hsl(var(--brand-logo-green))] text-white hover:bg-[hsl(var(--brand-logo-green-hover))]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          ) : (
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-center text-sm text-muted-foreground">
              {t("connectWallet")}
            </p>
          )}

          {/* Posts list */}
          {posts.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t("noPosts")}
            </p>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => {
                const isAuthor = post.wallet === walletAddr;
                // For current user, always use live profile; for others use stored data
                const avatar = isAuthor ? myAvatar : post.avatarUrl || null;
                const displayName = isAuthor
                  ? myName || post.name || shortWallet(post.wallet)
                  : post.name || shortWallet(post.wallet);
                return (
                  <div
                    key={post.id}
                    className="group rounded-lg border border-border bg-card p-3"
                  >
                    <div className="mb-1.5 flex items-center gap-2 text-xs">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt=""
                          className="h-5 w-5 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
                          <User className="h-3 w-3 text-muted-foreground" />
                        </span>
                      )}
                      <span className="font-medium text-foreground">
                        {displayName}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">
                        {timeAgo(post.timestamp, t)}
                      </span>
                      {isAuthor && (
                        <button
                          type="button"
                          onClick={() => handleDelete(post.id)}
                          className="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
                          title={t("delete")}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">
                      {post.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
