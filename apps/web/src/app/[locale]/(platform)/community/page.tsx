"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth/auth-provider";
import { ThreadList } from "@/components/community/thread-list";
import { CommunityStats } from "@/components/community/community-stats";
import { CategoryCard } from "@/components/community/category-card";
import { CreateThreadModal } from "@/components/community/create-thread-modal";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  {
    name: "General",
    slug: "general",
    description: "General discussions about Solana development",
  },
  {
    name: "Help",
    slug: "help",
    description: "Ask questions and get help from the community",
  },
  {
    name: "Showcase",
    slug: "showcase",
    description: "Share your projects and creations",
  },
  {
    name: "Off-Topic",
    slug: "off-topic",
    description: "Casual conversations and non-technical topics",
  },
] as const;

export default function CommunityPage() {
  const { user } = useAuth();

  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-[var(--text)]">
            Community
          </h1>
          <p className="mt-1 text-[var(--text-2)]">
            Discuss, ask questions, and share with fellow learners
          </p>
        </div>
        {user && (
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={18} />
            Ask a Question
          </Button>
        )}
      </div>

      <div className="flex gap-8">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Categories */}
          <div className="mb-8 grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => (
              <CategoryCard
                key={cat.slug}
                name={cat.name}
                slug={cat.slug}
                description={cat.description}
              />
            ))}
          </div>

          {/* Recent threads */}
          <h2 className="mb-4 font-display text-xl font-bold text-[var(--text)]">
            Recent Threads
          </h2>
          <ThreadList showFilters />
        </div>

        {/* Sidebar */}
        {user && (
          <aside className="hidden w-72 shrink-0 lg:block">
            <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-[var(--text-2)]">
              Your Stats
            </h3>
            <CommunityStats userId={user.id} />
          </aside>
        )}
      </div>

      <CreateThreadModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
