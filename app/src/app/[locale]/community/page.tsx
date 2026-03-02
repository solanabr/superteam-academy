"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { MessageSquare, CheckCircle2, Clock, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const MOCK_THREADS = [
  {
    id: "1",
    title: "How to derive PDAs in Anchor?",
    author: "user_abc1",
    courseId: "anchor-fundamentals",
    isSolved: true,
    replyCount: 5,
    createdAt: "2026-02-28T10:00:00Z",
  },
  {
    id: "2",
    title: "Token-2022 NonTransferable extension confusion",
    author: "user_def2",
    courseId: "token-2022-deep-dive",
    isSolved: false,
    replyCount: 3,
    createdAt: "2026-02-27T14:30:00Z",
  },
  {
    id: "3",
    title: "Best practices for CPI in Anchor programs",
    author: "user_ghi3",
    courseId: "anchor-fundamentals",
    isSolved: true,
    replyCount: 8,
    createdAt: "2026-02-26T09:15:00Z",
  },
  {
    id: "4",
    title: "Metaplex Core vs Token Metadata — when to use what?",
    author: "user_jkl4",
    courseId: "nft-masterclass",
    isSolved: false,
    replyCount: 12,
    createdAt: "2026-02-25T16:45:00Z",
  },
  {
    id: "5",
    title: "Help with AMM swap math",
    author: "user_mno5",
    courseId: "defi-basics",
    isSolved: false,
    replyCount: 2,
    createdAt: "2026-02-24T11:20:00Z",
  },
];

export default function CommunityPage() {
  const t = useTranslations("common");
  const locale = useLocale();
  const [search, setSearch] = useState("");

  const filtered = search
    ? MOCK_THREADS.filter((thread) =>
        thread.title.toLowerCase().includes(search.toLowerCase())
      )
    : MOCK_THREADS;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t("community")}</h1>
          <p className="text-muted-foreground">Ask questions, share knowledge, help others</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Thread
        </Button>
      </div>

      <Input
        placeholder="Search discussions..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="space-y-3">
        {filtered.map((thread) => (
          <Link key={thread.id} href={`/${locale}/community/${thread.id}`}>
            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-start gap-4">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="text-xs">
                    {thread.author.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm truncate">{thread.title}</h3>
                    {thread.isSolved && (
                      <Badge variant="outline" className="bg-superteam-green/10 text-superteam-green border-superteam-green/20 text-[10px] shrink-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Solved
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>@{thread.author}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {thread.courseId.replace(/-/g, " ")}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {thread.replyCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(thread.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
