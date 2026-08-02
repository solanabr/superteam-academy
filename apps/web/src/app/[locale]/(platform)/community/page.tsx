"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth/auth-provider";
import { ThreadList } from "@/components/community/thread-list";
import { CommunityStats } from "@/components/community/community-stats";
import { CategoryCard } from "@/components/community/category-card";
import { ThreadComposer } from "@/components/community/thread-composer";
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
  const t = useTranslations("community");

  // Inline composer (no modal) — opens at the top of the thread list, the
  // freshly posted thread appears in place via refreshToken.
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[var(--text)] sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 text-[var(--text-2)]">{t("subtitle")}</p>
        </div>
        {user && (
          <Button
            variant="primary"
            onClick={() => setCreateOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus size={18} />
            {t("askQuestion")}
          </Button>
        )}
      </div>

      <div className="flex gap-8">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Categories */}
          <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            {t("recentThreads")}
          </h2>
          {createOpen && user ? (
            <div className="mb-4 rounded-lg border border-[var(--border-default)] bg-[var(--card)] p-3">
              <h4 className="mb-3 font-display text-sm font-bold text-[var(--text)]">
                {t("composerHeading")}
              </h4>
              <ThreadComposer
                onCancel={() => setCreateOpen(false)}
                onCreated={() => {
                  setCreateOpen(false);
                  setRefreshToken((n) => n + 1);
                }}
              />
            </div>
          ) : null}
          <ThreadList
            showFilters
            showContext
            showCourseFilter
            refreshToken={refreshToken}
          />
        </div>

        {/* Sidebar */}
        {user && (
          <aside className="hidden w-72 shrink-0 lg:block">
            <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-[var(--text-2)]">
              {t("yourStats")}
            </h3>
            <CommunityStats userId={user.id} />
          </aside>
        )}
      </div>
    </div>
  );
}
