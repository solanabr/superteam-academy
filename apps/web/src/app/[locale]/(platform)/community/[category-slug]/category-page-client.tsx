"use client";

import { useState } from "react";
import { Plus, ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-provider";
import { ThreadList } from "@/components/community/thread-list";
import { CreateThreadModal } from "@/components/community/create-thread-modal";
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

  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Breadcrumb */}
      <Link
        href="/community"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--text-2)] transition-colors hover:text-[var(--primary)]"
      >
        <ArrowLeft size={14} />
        Community
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
            New Thread
          </Button>
        )}
      </div>

      {/* Thread list filtered by category */}
      <ThreadList
        scope={{ categorySlug: category.slug }}
        showFilters
        emptyMessage={`No threads in ${category.name} yet. Be the first to start a discussion!`}
      />

      <CreateThreadModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultScope={{ categoryId: category.id }}
      />
    </div>
  );
}
