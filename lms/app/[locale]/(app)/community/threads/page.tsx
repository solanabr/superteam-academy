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
  Coins,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Skeleton } from "@/components/ui/skeleton";
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
  const [newBounty, setNewBounty] = useState("");

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
      const bountyLamports = newType === "question" && newBounty
        ? Math.round(parseFloat(newBounty) * 1e9)
        : undefined;
      const result = await createThread.mutateAsync({
        title: newTitle.trim(),
        body: newBody.trim(),
        type: newType,
        tags: newTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        bountyLamports: bountyLamports && bountyLamports > 0 ? bountyLamports : undefined,
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
      setNewBounty("");
    } catch (err) {
      toast.error(t("threadCreateFailed"), {
        description: err instanceof Error ? err.message : undefined,
      });
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
            <Button disabled={!mounted || !publicKey} data-testid="new-thread-button">
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
                  <SelectTrigger className="w-40" data-testid="thread-type-select">
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
              {newType === "question" && (
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-xp-gold" />
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder={t("bountyPlaceholder")}
                    value={newBounty}
                    onChange={(e) => setNewBounty(e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">{t("bountyOptional")}</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateThread}
                disabled={createThread.isPending || !newTitle.trim() || !newBody.trim()}
                data-testid="create-thread-submit"
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
          <TabsList data-testid="thread-filter-tabs">
            <TabsTrigger value="all" data-testid="tab-all">{t("all")}</TabsTrigger>
            <TabsTrigger value="discussion" data-testid="tab-discussion">{t("discussions")}</TabsTrigger>
            <TabsTrigger value="question" data-testid="tab-question">{t("questions")}</TabsTrigger>
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

      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-start gap-4 p-4">
                <div className="flex flex-col items-center gap-1 pt-1">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 w-6" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-3">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
              <Card className="transition-colors hover:bg-accent/50" data-testid="thread-card">
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
                      {thread.bountyLamports > 0 && (
                        <Badge
                          variant={thread.bountyPaid ? "beginner" : "xp"}
                          className="shrink-0"
                        >
                          <Coins className="mr-1 h-3 w-3" />
                          {(thread.bountyLamports / 1e9).toFixed(thread.bountyLamports % 1e9 === 0 ? 0 : 3)} SOL
                          {thread.bountyPaid && ` - ${t("bountyPaid")}`}
                        </Badge>
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
    </div>
  );
}
