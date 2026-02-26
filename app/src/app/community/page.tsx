"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  MessageSquare,
  Search,
  Plus,
  Pin,
  CheckCircle2,
  MessageCircle,
  Eye,
  Clock,
  Filter,
} from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOCK_DISCUSSION_THREADS } from "@/lib/mock-data";
import { cn } from "@/lib/utils/cn";

const categories = ["All", "Q&A", "Discussion", "Showcase"];

export default function CommunityPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = MOCK_DISCUSSION_THREADS.filter((t) => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || t.category === category;
    return matchSearch && matchCat;
  });

  return (
    <PageLayout>
      <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="relative overflow-hidden pt-10 pb-8 mb-6">
            <div className="absolute inset-0 bg-grid opacity-[0.12]" />
            <div className="section-divider absolute bottom-0 left-0 right-0" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-[#9945FF]" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Community
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                Discussion <span className="gradient-text">Forum</span>
              </h1>
              <p className="text-muted-foreground text-base max-w-xl">
                Ask questions, share projects, and connect with Solana builders across LATAM.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search discussions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white/5 border-white/10"
              />
            </div>
            <Button variant="gradient" size="sm" className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              New Thread
            </Button>
          </div>

          {/* Category filters */}
          <div className="flex gap-2 flex-wrap mb-6">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                  category === c
                    ? "bg-[#9945FF]/15 border-[#9945FF]/40 text-[#9945FF]"
                    : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
                )}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Thread list */}
          <div className="bento-card overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-12 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground">No discussions found</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {filtered.map((thread, i) => (
                  <motion.div
                    key={thread.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-4 p-4 hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0",
                        thread.isResolved ? "bg-[#14F195]/15 text-[#14F195]" : "bg-[#9945FF]/15 text-[#9945FF]"
                      )}
                    >
                      {thread.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {thread.isPinned && (
                          <Pin className="h-3 w-3 text-yellow-400 shrink-0" />
                        )}
                        {thread.isResolved && (
                          <CheckCircle2 className="h-3 w-3 text-[#14F195] shrink-0" />
                        )}
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0"
                          style={{
                            color: "#9945FF",
                            backgroundColor: "rgba(153,69,255,0.1)",
                            borderColor: "rgba(153,69,255,0.3)",
                          }}
                        >
                          {thread.category}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                        {thread.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>by {thread.author}</span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {thread.replies}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {thread.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {thread.lastActivity.getTime() > Date.now() - 24 * 60 * 60 * 1000
                            ? "Today"
                            : `${Math.floor((Date.now() - thread.lastActivity.getTime()) / (24 * 60 * 60 * 1000))}d ago`}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
