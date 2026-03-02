// app/src/app/[locale]/(dashboard)/forum/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Users, BookOpen } from "lucide-react";

export default function ForumPage() {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/forum')
      .then(res => res.json())
      .then(data => {
          if (!data.error) setThreads(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Community Forum</h2>
            <p className="text-muted-foreground mt-1">Discuss lessons, ask for help, and connect with builders.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
        ) : threads.length === 0 ? (
            <div className="text-center p-12 border-2 border-dashed rounded-xl text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-4 opacity-50" />
                <p>No discussions yet. Go to a lesson and ask the first question!</p>
            </div>
        ) : (
            threads.map(thread => {
                const displayName = thread.user.username || `${thread.user.walletAddress?.slice(0, 4)}...`;
                
                return (
                    <Link href={`/forum/${thread.id}`} key={thread.id}>
                        <Card className="hover:border-primary/50 transition-colors cursor-pointer bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-4 md:p-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
                                
                                {/* Аватар (Скрыт на мобилках для экономии места) */}
                                <Avatar className="h-10 w-10 hidden sm:block border">
                                    <AvatarImage src={thread.user.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${thread.user.walletAddress}`} />
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>

                                {/* Контент вопроса */}
                                <div className="flex-1 space-y-1">
                                    <h3 className="font-semibold text-lg line-clamp-1">
                                        {/* У нас нет заголовка у коммента, поэтому используем первые слова как заголовок */}
                                        {thread.content.length > 60 ? `${thread.content.substring(0, 60)}...` : thread.content}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <Badge variant="secondary" className="font-normal text-[10px]">
                                            <BookOpen className="h-3 w-3 mr-1" />
                                            {thread.courseTitle} (Lesson {thread.lessonIndex + 1})
                                        </Badge>
                                        <span>•</span>
                                        <span className="font-medium text-foreground">{displayName}</span>
                                        <span>•</span>
                                        <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
                                    </div>
                                </div>

                                {/* Счетчик ответов */}
                                <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg shrink-0">
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-semibold">{thread._count.replies}</span>
                                </div>

                            </CardContent>
                        </Card>
                    </Link>
                );
            })
        )}
      </div>
    </div>
  );
}