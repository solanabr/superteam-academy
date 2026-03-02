// app/src/app/[locale]/(dashboard)/forum/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const { userDb } = useUser();
  const threadId = params.id as string;

  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchThread = async () => {
    try {
        const res = await fetch(`/api/forum/${threadId}`);
        if (!res.ok) throw new Error("Thread not found");
        const data = await res.json();
        setThread(data);
    } catch (e) {
        toast.error("Failed to load discussion");
        router.push("/forum");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchThread();
  }, [threadId]);

  const handleReply = async () => {
      if (!userDb) { toast.error("Please sign in to reply"); return; }
      if (!replyContent.trim()) return;

      setIsSubmitting(true);
      try {
          const res = await fetch('/api/discussions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  courseId: thread.courseId,
                  lessonIndex: thread.lessonIndex,
                  content: replyContent,
                  walletAddress: userDb.walletAddress,
                  parentId: thread.id // <-- ВАЖНО: Указываем, что это ответ на текущий тред
              })
          });

          if (res.ok) {
              setReplyContent("");
              fetchThread(); // Перезагружаем тред, чтобы увидеть ответ
              toast.success("Reply posted!");
          } else {
              throw new Error("Failed to post");
          }
      } catch (e) {
          toast.error("Error posting reply");
      } finally {
          setIsSubmitting(false);
      }
  };

  if (loading) return <div className="p-8 max-w-4xl mx-auto space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (!thread) return null;

  // Компонент для отрисовки сообщения (используется и для вопроса, и для ответа)
  const MessageBlock = ({ msg, isOp = false }: { msg: any, isOp?: boolean }) => {
      const displayName = msg.user.username || msg.user.githubHandle || `${msg.user.walletAddress?.slice(0, 4)}...`;
      const isAdmin = msg.user.role === "ADMIN";

      return (
          <div className={`flex gap-4 p-6 ${isOp ? 'bg-card border rounded-xl shadow-sm' : 'bg-transparent border-b last:border-0'}`}>
              <Avatar className={`border ${isOp ? 'h-12 w-12' : 'h-10 w-10'}`}>
                  <AvatarImage src={msg.user.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${msg.user.walletAddress}`} />
                  <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                      <span className={`font-bold ${isOp ? 'text-base' : 'text-sm'}`}>{displayName}</span>
                      {isAdmin && <Badge className="text-[10px] h-4 px-1.5 bg-purple-500">Core Team</Badge>}
                      {isOp && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Author</Badge>}
                      <span className="text-xs text-muted-foreground ml-auto">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </span>
                  </div>
                  <p className={`whitespace-pre-wrap leading-relaxed ${isOp ? 'text-base' : 'text-sm text-foreground/90'}`}>
                      {msg.content}
                  </p>
              </div>
          </div>
      );
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 max-w-4xl mx-auto w-full pb-32">
      <Button variant="ghost" size="sm" onClick={() => router.push('/forum')} className="-ml-3 mb-2 text-muted-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Forum
      </Button>

      {/* Инфа о том, к какому уроку это относится */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span className="bg-muted px-2 py-1 rounded-md font-medium text-foreground">
              {thread.courseTitle}
          </span>
          <span>→</span>
          <span>Lesson {thread.lessonIndex + 1}</span>
          <Link href={`/courses/${thread.courseId}/lessons/${thread.lessonIndex}`}>
              <Button variant="link" size="sm" className="h-auto p-0 ml-2">Go to lesson</Button>
          </Link>
      </div>

      {/* Оригинальный Вопрос (OP - Original Poster) */}
      <MessageBlock msg={thread} isOp={true} />

      {/* Секция Ответов */}
      <div className="pt-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {thread.replies.length} {thread.replies.length === 1 ? 'Reply' : 'Replies'}
          </h3>
          
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden mb-8">
              {thread.replies.map((reply: any) => (
                  <MessageBlock key={reply.id} msg={reply} />
              ))}
              {thread.replies.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                      No answers yet. Can you help?
                  </div>
              )}
          </div>

          {/* Форма ответа */}
          <div className="bg-card border rounded-xl p-4 shadow-sm">
              <h4 className="font-semibold mb-3 text-sm">Add a reply</h4>
              <Textarea 
                  placeholder="Type your answer here..."
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  className="min-h-[100px] mb-3 bg-background resize-none"
              />
              <div className="flex justify-end">
                  <Button onClick={handleReply} disabled={isSubmitting || !replyContent.trim()}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Post Reply
                  </Button>
              </div>
          </div>
      </div>
    </div>
  );
}