"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-provider";
import { ThreadList } from "@/components/community/thread-list";
import { ThreadComposer } from "@/components/community/thread-composer";
import { Button } from "@/components/ui/button";

interface CategoryPageClientProps {
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
}

export function CategoryPageClient({ category }: CategoryPageClientProps) {
  const { user } = useAuth();
  const t = useTranslations("community");

  // Inline composer (no modal) — same pattern as the community index,
  // course and lesson embeds.
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Breadcrumb */}
      <Link
        href="/community"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--text-2)] transition-colors hover:text-[var(--primary)]"
      >
        <ArrowLeft size={14} />
        {t("title")}
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[var(--text)]">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-1 text-[var(--text-2)]">{category.description}</p>
          )}
        </div>
        {user && (
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={18} />
            {t("askQuestion")}
          </Button>
        )}
      </div>

      {createOpen && user ? (
        <div className="mb-4 rounded-lg border border-[var(--border-default)] bg-[var(--card)] p-3">
          <h4 className="mb-3 font-display text-sm font-bold text-[var(--text)]">
            {t("composerHeading")}
          </h4>
          <ThreadComposer
            defaultScope={{ categoryId: category.id }}
            onCancel={() => setCreateOpen(false)}
            onCreated={() => {
              setCreateOpen(false);
              setRefreshToken((n) => n + 1);
            }}
          />
        </div>
      ) : null}

      {/* Thread list filtered by category */}
      <ThreadList
        scope={{ categorySlug: category.slug }}
        showFilters
        showContext
        refreshToken={refreshToken}
        emptyMessage={`No threads in ${category.name} yet. Be the first to start a discussion!`}
      />
    </div>
  );
}
