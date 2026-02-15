"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { Link } from "@/i18n/navigation";
import {
  MessageSquare,
  HelpCircle,
  Eye,
  ArrowBigUp,
  CheckCircle2,
  Plus,
  Star,
  Award,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useThreads, useCommunityStats, useCreateThread } from "@/lib/hooks/use-community";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CommunityThreadsPage() {
  const t = useTranslations("community");
  const tc = useTranslations("common");
  const { publicKey } = useWallet();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [typeFilter, setTypeFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  // New thread form
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newType, setNewType] = useState<"discussion" | "question">("discussion");
  const [newTags, setNewTags] = useState("");

  const { data, isLoading } = useThreads({
    type: typeFilter !== "all" ? typeFilter : undefined,
    sort,
    page,
  });
  const { data: stats } = useCommunityStats();
  const createThread = useCreateThread();

  const threads = data?.threads ?? [];
  const totalPages = data?.totalPages ?? 1;

  async function handleCreateThread() {
    if (!publicKey) return;
    if (!newTitle.trim() || !newBody.trim()) return;

    try {
      const result = await createThread.mutateAsync({
        title: newTitle.trim(),
        body: newBody.trim(),
        type: newType,
        tags: newTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      const sig = result.txSignature;
      if (sig) {
        toast.success(t("threadCreated"), {
          description: `Tx: ${sig.slice(0, 8)}...${sig.slice(-8)}`,
          action: {
            label: tc("view"),
            onClick: () => window.open(`https://explorer.solana.com/tx/${sig}?cluster=devnet`, "_blank"),
          },
        });
      } else {
        toast.success(t("threadCreated"));
      }
      setDialogOpen(false);
      setNewTitle("");
      setNewBody("");
      setNewType("discussion");
      setNewTags("");
    } catch {
      toast.error(t("threadCreateFailed"));
    }
  }

  function formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!mounted || !publicKey}>
              <Plus className="mr-2 h-4 w-4" />
              {t("newThread")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("newThread")}</DialogTitle>
              <DialogDescription>{t("newThreadDesc")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder={t("titlePlaceholder")}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <Textarea
                placeholder={t("bodyPlaceholder")}
                rows={5}
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
              />
              <div className="flex gap-4">
                <Select
                  value={newType}
                  onValueChange={(v) => setNewType(v as "discussion" | "question")}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discussion">{t("discussion")}</SelectItem>
                    <SelectItem value="question">{t("question")}</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder={t("tagsPlaceholder")}
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateThread}
                disabled={createThread.isPending || !newTitle.trim() || !newBody.trim()}
              >
                {createThread.isPending ? t("creating") : t("create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats cards */}
      {mounted && publicKey && stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Star className="h-5 w-5 text-xp-gold" />
              <div>
                <p className="text-2xl font-bold">{stats.communityPoints}</p>
                <p className="text-xs text-muted-foreground">{t("points")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Award className="h-5 w-5 text-solana-purple" />
              <div>
                <p className="text-2xl font-bold">{stats.endorsementCount}</p>
                <p className="text-xs text-muted-foreground">{t("endorsements")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs + Sort */}
      <Tabs value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="all">{t("all")}</TabsTrigger>
            <TabsTrigger value="discussion">{t("discussions")}</TabsTrigger>
            <TabsTrigger value="question">{t("questions")}</TabsTrigger>
          </TabsList>
          <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">{t("sortRecent")}</SelectItem>
              <SelectItem value="popular">{t("sortPopular")}</SelectItem>
              <SelectItem value="unsolved">{t("sortUnsolved")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value={typeFilter}>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">{t("loading")}</div>
          ) : threads.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-muted-foreground">{t("noThreads")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {threads.map((thread) => (
                <Link key={thread._id} href={`/community/threads/${thread._id}`}>
                  <Card className="transition-colors hover:bg-accent/50">
                    <CardContent className="flex items-start gap-4 p-4">
                      {/* Upvote count */}
                      <div className="flex flex-col items-center gap-0.5 pt-1 text-muted-foreground">
                        <ArrowBigUp className="h-5 w-5" />
                        <span className="text-sm font-medium">{thread.upvotes.length}</span>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {thread.type === "question" ? (
                            <HelpCircle className="h-4 w-4 shrink-0 text-solana-purple" />
                          ) : (
                            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <h3 className="truncate font-semibold">{thread.title}</h3>
                          {thread.isSolved && (
                            <Badge variant="beginner" className="shrink-0">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              {t("solved")}
                            </Badge>
                          )}
                          {thread.isPinned && (
                            <Badge variant="xp" className="shrink-0">{t("pinned")}</Badge>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                          {thread.body}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>{thread.authorName}</span>
                          <span>{formatTimeAgo(thread.createdAt)}</span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {thread.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {thread.replyCount}
                          </span>
                          {thread.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {thread.txHash && (
                            <span
                              role="link"
                              className="inline-flex items-center gap-1 text-solana-green hover:underline cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.open(`https://explorer.solana.com/tx/${thread.txHash}?cluster=devnet`, "_blank");
                              }}
                            >
                              <ExternalLink className="h-3 w-3" />
                              {thread.txHash.slice(0, 8)}...{thread.txHash.slice(-4)}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t("prev")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("next")}
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
