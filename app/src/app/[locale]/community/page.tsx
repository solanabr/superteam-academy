"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  MessageSquare,
  ThumbsUp,
  Clock,
  Plus,
  Search,
  Star,
} from "lucide-react";

const MOCK_POSTS = [
  {
    id: "p1",
    author: "Maria Silva",
    title: "How to handle account validation in Anchor?",
    content:
      "I'm building a program that requires multiple account validations. What are the best practices for handling complex constraint validation in Anchor? Should I use custom validation functions or rely on constraint macros?",
    course: "Anchor Framework Fundamentals",
    upvotes: 15,
    replies: 4,
    createdAt: "2026-02-14T10:30:00Z",
  },
  {
    id: "p2",
    author: "Pedro Santos",
    title: "Understanding Token-2022 extensions",
    content:
      "Can someone explain the difference between NonTransferable and PermanentDelegate extensions? When would you use one over the other for soulbound tokens?",
    course: "Introduction to Solana",
    upvotes: 23,
    replies: 7,
    createdAt: "2026-02-13T15:45:00Z",
  },
  {
    id: "p3",
    author: "Ana Costa",
    title: "Best resources for learning Rust as a JS dev?",
    content:
      "I come from a JavaScript/TypeScript background and I'm starting to learn Rust for Solana development. What resources have you found most helpful for the transition?",
    upvotes: 31,
    replies: 12,
    createdAt: "2026-02-12T09:00:00Z",
  },
  {
    id: "p4",
    author: "Lucas Oliveira",
    title: "AMM constant product formula implementation",
    content:
      "I'm stuck on implementing the swap function for my AMM. The constant product formula seems straightforward but I'm getting rounding errors. Any tips?",
    course: "DeFi on Solana",
    upvotes: 8,
    replies: 3,
    createdAt: "2026-02-11T14:20:00Z",
  },
];

export default function CommunityPage() {
  const t = useTranslations("community");
  const tc = useTranslations("common");
  const [search, setSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const filtered = MOCK_POSTS.filter(
    (p) =>
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t("newPost")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("newPost")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
              <Button className="w-full">{tc("submit")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={tc("search") + "..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-3 text-muted-foreground">{t("noPostsYet")}</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((post) => (
            <Card
              key={post.id}
              className="transition-all hover:border-primary/50"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Upvote */}
                  <div className="flex flex-col items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">{post.upvotes}</span>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{post.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {post.content}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                          <Star className="h-3 w-3 text-primary" />
                        </div>
                        {post.author}
                      </span>
                      {post.course && (
                        <Badge variant="outline" className="text-[10px]">
                          {post.course}
                        </Badge>
                      )}
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {post.replies} {t("reply").toLowerCase()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
