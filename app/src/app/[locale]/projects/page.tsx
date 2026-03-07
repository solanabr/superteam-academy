"use client";

import { useState, useEffect, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FilterCard } from "@/components/ui/filter-card";
import { MarketplaceCard } from "@/components/ui/marketplace-card";
import { MarketplaceShell } from "@/components/ui/marketplace-shell";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { PremiumEmptyState } from "@/components/ui/premium-empty-state";
import { SegmentedFilter } from "@/components/ui/segmented-filter";
import { ProjectGallery } from "@/components/projects/ProjectGallery";
import type { Project } from "@/components/projects/ProjectCard";
import { getLocaleDirection } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/request";
import { CardContent } from "@/components/ui/card";
import { Search, Plus, TrendingUp, Clock, Star, Loader2 } from "lucide-react";

type ApiProject = {
  id: string;
  title: string;
  description: string;
  thumbnail?: string | null;
  tags: string[];
  likes: number;
  views: number;
  ownerId: string;
  githubUrl?: string | null;
  demoUrl?: string | null;
  createdAt: string;
};

function mapProject(project: ApiProject): Project {
  const shortOwner = `${project.ownerId.slice(0, 6)}...`;

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    thumbnail: project.thumbnail || undefined,
    tags: project.tags,
    likes: project.likes,
    views: project.views,
    author: { name: shortOwner },
    demoUrl: project.demoUrl || undefined,
    repoUrl: project.githubUrl || undefined,
    featured: project.likes >= 25 || project.views >= 100,
    createdAt: project.createdAt,
  };
}

const sortOptions = [
  { value: "newest", label: "Newest", icon: Clock },
  { value: "popular", label: "Most Popular", icon: TrendingUp },
  { value: "liked", label: "Most Liked", icon: Star },
];

export default function ProjectsPage() {
  const t = useTranslations("common");
  const tProjects = useTranslations("projects");
  const locale = useLocale();
  const isRtl = getLocaleDirection(locale as Locale) === "rtl";
  const searchIconClass = isRtl ? "right-3" : "left-3";
  const searchInputClass = isRtl ? "pr-10" : "pl-10";

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [likedProjects, setLikedProjects] = useState<string[]>([]);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch("/api/projects", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Failed to load projects (${res.status})`);
        }
        const data = (await res.json()) as { projects?: ApiProject[] };
        setProjects((data.projects ?? []).map(mapProject));
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    projects.forEach((p) => p.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [projects]);

  const featuredProjects = useMemo(
    () => projects.filter((p) => p.featured),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    let result = projects.filter((p) => !p.featured);

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    if (selectedTag) {
      result = result.filter((p) => p.tags.includes(selectedTag));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "popular":
          return b.views - a.views;
        case "liked":
          return b.likes - a.likes;
        default:
          return 0;
      }
    });

    return result;
  }, [projects, search, selectedTag, sortBy]);

  const handleLike = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/like`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error(`Failed to toggle like (${res.status})`);
      }
      const data = (await res.json()) as { liked?: boolean };
      const liked = Boolean(data.liked);

      setLikedProjects((prev) =>
        liked ? Array.from(new Set([...prev, projectId])) : prev.filter((id) => id !== projectId)
      );
      setProjects((prev) =>
        prev.map((project) =>
          project.id === projectId
            ? { ...project, likes: Math.max(0, project.likes + (liked ? 1 : -1)) }
            : project
        )
      );
    } catch (error) {
      console.error("Failed to toggle project like:", error);
    }
  };

  if (isLoading) {
    return (
      <PageShell
        hero={
          <PageHeader
            badge={{ variant: "brand", icon: TrendingUp, label: tProjects("title") }}
            icon={<TrendingUp className="h-5 w-5" />}
            title={tProjects("title")}
            description={tProjects("subtitle")}
          />
        }
      >
        <MarketplaceShell
          isLoading
          filters={<div className="marketplace-panel flex min-h-[24rem] items-center justify-center rounded-[1.5rem]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
          toolbar={<div className="marketplace-toolbar h-16 rounded-[1.25rem]" />}
          loading={<div className="marketplace-panel min-h-[24rem] rounded-[1.5rem]" />}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      hero={
        <PageHeader
          badge={{ variant: "brand", icon: TrendingUp, label: tProjects("title") }}
          icon={<TrendingUp className="h-5 w-5" />}
          title={tProjects("title")}
          description={tProjects("subtitle")}
          actions={
            <Link href="/projects/new">
              <Button variant="solana" className="gap-2">
                <Plus className="h-4 w-4" />
                {tProjects("submitProject")}
              </Button>
            </Link>
          }
        />
      }
    >
      <MarketplaceShell
        filters={
          <FilterCard
            title={tProjects("title")}
            description={tProjects("searchPlaceholder")}
            className="marketplace-panel"
          >
            <div className="relative">
              <Search
                className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${searchIconClass}`}
              />
              <Input
                placeholder={tProjects("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={searchInputClass}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={`marketplace-pill cursor-pointer ${selectedTag === null ? "border-border bg-card text-foreground" : ""}`}
                onClick={() => setSelectedTag(null)}
              >
                {tProjects("allProjects")}
              </Badge>
              {availableTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={`marketplace-pill cursor-pointer ${selectedTag === tag ? "border-border bg-card text-foreground" : ""}`}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </FilterCard>
        }
        toolbar={
          <FilterBar
            sticky
            resultsSlot={`${filteredProjects.length} · ${tProjects("title")}`}
            segmentsSlot={
              <SegmentedFilter
                ariaLabel={tProjects("sortBy")}
                value={sortBy}
                onValueChange={setSortBy}
                options={sortOptions.map((option) => ({
                  value: option.value,
                  label: (
                    <span className="inline-flex items-center gap-1.5">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </span>
                  ),
                }))}
              />
            }
          />
        }
        content={
          <div className="space-y-6">
            {featuredProjects.length > 0 ? (
              <MarketplaceCard accent>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-foreground">Featured Projects</h2>
                    <Badge variant="outline" className="border-border/70 bg-background/70 text-muted-foreground">
                      {featuredProjects.length}
                    </Badge>
                  </div>
                  <ProjectGallery
                    projects={featuredProjects}
                    onLike={handleLike}
                    likedProjects={likedProjects}
                    columns={3}
                  />
                </CardContent>
              </MarketplaceCard>
            ) : null}
            {filteredProjects.length === 0 ? (
              <PremiumEmptyState
                icon={Search}
                title={t("noResults")}
                description={tProjects("searchPlaceholder")}
                action={
                  <>
                    <Button type="button" variant="outline" onClick={() => { setSearch(""); setSelectedTag(null); }}>
                      {t("clear")}
                    </Button>
                    <Link href="/projects/new">
                      <Button type="button">{tProjects("submitProject")}</Button>
                    </Link>
                  </>
                }
              />
            ) : (
              <ProjectGallery
                projects={filteredProjects}
                onLike={handleLike}
                likedProjects={likedProjects}
                columns={3}
              />
            )}
          </div>
        }
      />
    </PageShell>
  );
}
