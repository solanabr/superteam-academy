"use client";

import { useState, use } from "react";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { Link } from "@/i18n/navigation";
import {
  ArrowBigUp,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  Eye,
  Award,
  Send,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  useThread,
  useReplies,
  useCreateReply,
  useUpvote,
  useMarkSolution,
  useEndorseUser,
} from "@/lib/hooks/use-community";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ThreadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("community");
  const tc = useTranslations("common");
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "";

  const { data: thread, isLoading: threadLoading } = useThread(id);
  const { data: replies = [], isLoading: repliesLoading } = useReplies(id);
  const createReply = useCreateReply();
  const upvote = useUpvote();
  const markSolution = useMarkSolution();
  const endorseUser = useEndorseUser();

  const [replyBody, setReplyBody] = useState("");

  async function handleReply() {
    if (!publicKey || !replyBody.trim()) return;
    try {
      const result = await createReply.mutateAsync({
        threadId: id,
        body: replyBody.trim(),
      });
      const sig = result.txSignature;
      if (sig) {
        toast.success(t("replyPosted"), {
          description: `Tx: ${sig.slice(0, 8)}...${sig.slice(-8)}`,
          action: {
            label: tc("view"),
            onClick: () => window.open(`https://explorer.solana.com/tx/${sig}?cluster=devnet`, "_blank"),
          },
        });
      } else {
        toast.success(t("replyPosted"));
      }
      setReplyBody("");
    } catch {
      toast.error(t("replyFailed"));
    }
  }

  async function handleUpvote(targetId: string, targetType: "thread" | "reply") {
    if (!publicKey) return;
    try {
      await upvote.mutateAsync({ targetId, targetType });
    } catch {
      // silent
    }
  }

  async function handleMarkSolution(replyId: string) {
    if (!publicKey) return;
    try {
      const result = await markSolution.mutateAsync({ threadId: id, replyId });
      const sig = result.txSignature;
      if (sig) {
        toast.success(t("solutionMarked"), {
          description: `Tx: ${sig.slice(0, 8)}...${sig.slice(-8)}`,
          action: {
            label: tc("view"),
            onClick: () => window.open(`https://explorer.solana.com/tx/${sig}?cluster=devnet`, "_blank"),
          },
        });
      } else {
        toast.success(t("solutionMarked"));
      }
    } catch {
      toast.error(t("solutionFailed"));
    }
  }

  async function handleEndorse(endorsee: string) {
    if (!publicKey || endorsee === userId) return;
    try {
      const result = await endorseUser.mutateAsync({ endorsee });
      const sig = result.txSignature;
      if (sig) {
        toast.success(t("endorsed"), {
          description: `Tx: ${sig.slice(0, 8)}...${sig.slice(-8)}`,
          action: {
            label: tc("view"),
            onClick: () => window.open(`https://explorer.solana.com/tx/${sig}?cluster=devnet`, "_blank"),
          },
        });
      } else {
        toast.success(t("endorsed"));
      }
    } catch {
      toast.error(t("endorseFailed"));
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (threadLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-muted-foreground">{t("threadNotFound")}</p>
        <Link href="/community/threads">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToThreads")}
          </Button>
        </Link>
      </div>
    );
  }

  const isAuthor = userId === thread.author;
  const isQuestion = thread.type === "question";
  const hasUpvoted = thread.upvotes.includes(userId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/community/threads"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToThreads")}
      </Link>

      {/* Thread */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex gap-4">
            {/* Upvote */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleUpvote(thread._id, "thread")}
                disabled={!publicKey}
                className={cn(
                  "rounded-md p-1 transition-colors hover:bg-accent",
                  hasUpvoted && "text-solana-green"
                )}
              >
                <ArrowBigUp className="h-6 w-6" />
              </button>
              <span className="text-sm font-semibold">{thread.upvotes.length}</span>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {isQuestion ? (
                  <HelpCircle className="h-5 w-5 text-solana-purple" />
                ) : (
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                )}
                <h1 className="text-xl font-bold">{thread.title}</h1>
                {thread.isSolved && (
                  <Badge variant="beginner">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {t("solved")}
                  </Badge>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <button
                  onClick={() => handleEndorse(thread.author)}
                  disabled={!publicKey || thread.author === userId}
                  className="flex items-center gap-1 hover:text-foreground"
                  title={t("endorse")}
                >
                  <Award className="h-3 w-3" />
                  {thread.author.slice(0, 4)}...{thread.author.slice(-4)}
                </button>
                <span>{formatDate(thread.createdAt)}</span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {thread.views}
                </span>
                {thread.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {thread.txHash && (
                  <a
                    href={`https://explorer.solana.com/tx/${thread.txHash}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-solana-green hover:underline"
                  >
                    Tx
                  </a>
                )}
              </div>

              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">
                {thread.body}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      <div className="mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h2 className="text-lg font-semibold">
          {t("replies")} ({replies.length})
        </h2>
      </div>

      {repliesLoading ? (
        <p className="text-muted-foreground">{t("loading")}</p>
      ) : replies.length === 0 ? (
        <Card className="mb-6">
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("noReplies")}
          </CardContent>
        </Card>
      ) : (
        <div className="mb-6 space-y-3">
          {replies.map((reply) => {
            const replyHasUpvoted = reply.upvotes.includes(userId);
            const isSolution = thread.solvedReplyId === reply._id;

            return (
              <Card
                key={reply._id}
                className={cn(isSolution && "border-solana-green/50 bg-solana-green/5")}
              >
                <CardContent className="flex gap-4 p-4">
                  {/* Upvote */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => handleUpvote(reply._id, "reply")}
                      disabled={!publicKey}
                      className={cn(
                        "rounded-md p-1 transition-colors hover:bg-accent",
                        replyHasUpvoted && "text-solana-green"
                      )}
                    >
                      <ArrowBigUp className="h-5 w-5" />
                    </button>
                    <span className="text-xs font-semibold">{reply.upvotes.length}</span>
                    {isSolution && (
                      <CheckCircle2 className="h-5 w-5 text-solana-green" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <button
                          onClick={() => handleEndorse(reply.author)}
                          disabled={!publicKey || reply.author === userId}
                          className="flex items-center gap-1 hover:text-foreground"
                          title={t("endorse")}
                        >
                          <Award className="h-3 w-3" />
                          {reply.author.slice(0, 4)}...{reply.author.slice(-4)}
                        </button>
                        <span>{formatDate(reply.createdAt)}</span>
                        {reply.txHash && (
                          <a
                            href={`https://explorer.solana.com/tx/${reply.txHash}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-solana-green hover:underline"
                          >
                            Tx
                          </a>
                        )}
                        {isSolution && (
                          <Badge variant="beginner">{t("solution")}</Badge>
                        )}
                      </div>
                      {isAuthor && isQuestion && !thread.isSolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkSolution(reply._id)}
                          disabled={markSolution.isPending}
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          {t("markSolution")}
                        </Button>
                      )}
                    </div>
                    <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                      {reply.body}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reply composer */}
      {publicKey ? (
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-2 text-sm font-semibold">{t("writeReply")}</h3>
            <Textarea
              placeholder={t("replyPlaceholder")}
              rows={3}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
            />
            <div className="mt-3 flex justify-end">
              <Button
                onClick={handleReply}
                disabled={createReply.isPending || !replyBody.trim()}
                size="sm"
              >
                <Send className="mr-2 h-4 w-4" />
                {createReply.isPending ? t("posting") : t("postReply")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            {t("connectToReply")}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
