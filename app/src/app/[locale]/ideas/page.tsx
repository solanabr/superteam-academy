"use client";

import { useState, useEffect, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FilterCard } from "@/components/ui/filter-card";
import { MarketplaceShell } from "@/components/ui/marketplace-shell";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { PremiumEmptyState } from "@/components/ui/premium-empty-state";
import { SegmentedFilter } from "@/components/ui/segmented-filter";
import { IdeaCard, type Idea } from "@/components/ideas/IdeaCard";
import { InterestModal } from "@/components/ideas/InterestModal";
import { getLocaleDirection } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/request";
import { Search, Plus, Loader2, Lightbulb } from "lucide-react";
import { formatRelativeDate } from "@/lib/feature-ui";

type ApiIdea = {
  id: string;
  title: string;
  problem: string;
  solution: string;
  stage: string;
  lookingFor: string[];
  createdAt: string;
  owner?: {
    id?: string | null;
    displayName?: string | null;
    username?: string | null;
    avatarUrl?: string | null;
  };
  _count?: {
    interested?: number;
  };
};

const interestRoleMap: Record<
  string,
  "developer" | "designer" | "advisor" | "marketer" | "investor"
> = {
  developer: "developer",
  designer: "designer",
  "product-manager": "advisor",
  marketing: "marketer",
  "business-development": "advisor",
  investor: "investor",
  other: "advisor",
};

function formatIdentity(value?: string | null): string | undefined {
  return value ? `${value.slice(0, 8)}...` : undefined;
}

function mapIdea(idea: ApiIdea): Idea {
  const stage = ["idea", "mvp", "launched"].includes(idea.stage)
    ? (idea.stage as Idea["stage"])
    : "idea";
  const authorName =
    idea.owner?.displayName || idea.owner?.username || formatIdentity(idea.owner?.id);

  return {
    id: idea.id,
    title: idea.title,
    problem: idea.problem,
    solution: idea.solution,
    stage,
    lookingFor: idea.lookingFor,
    skillsNeeded: idea.lookingFor,
    author: authorName
      ? {
          name: authorName,
          avatar: idea.owner?.avatarUrl || undefined,
        }
      : undefined,
    interestedCount: idea._count?.interested ?? 0,
    createdAt: formatRelativeDate(idea.createdAt),
  };
}

export default function IdeasPage() {
  const t = useTranslations("common");
  const tIdeas = useTranslations("ideas");
  const locale = useLocale();
  const isRtl = getLocaleDirection(locale as Locale) === "rtl";
  const searchIconClass = isRtl ? "right-3" : "left-3";
  const searchInputClass = isRtl ? "pr-10" : "pl-10";

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [interestIdea, setInterestIdea] = useState<Idea | null>(null);

  useEffect(() => {
    async function fetchIdeas() {
      try {
        const res = await fetch("/api/ideas", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Failed to load ideas (${res.status})`);
        }
        const data = (await res.json()) as { ideas?: ApiIdea[] };
        setIdeas((data.ideas ?? []).map(mapIdea));
      } catch (error) {
        console.error("Failed to fetch ideas:", error);
        setIdeas([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchIdeas();
  }, []);

  const availableRoles = useMemo(() => {
    const roles = new Set<string>();
    ideas.forEach((i) => i.lookingFor.forEach((r) => roles.add(r)));
    return Array.from(roles).sort();
  }, [ideas]);

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          idea.title.toLowerCase().includes(searchLower) ||
          idea.problem.toLowerCase().includes(searchLower) ||
          idea.solution.toLowerCase().includes(searchLower) ||
          idea.lookingFor.some((r) => r.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      if (selectedStage && idea.stage !== selectedStage) {
        return false;
      }

      if (selectedRole && !idea.lookingFor.includes(selectedRole)) {
        return false;
      }

      return true;
    });
  }, [ideas, search, selectedStage, selectedRole]);

  const handleExpressInterest = (ideaId: string) => {
    const idea = ideas.find((i) => i.id === ideaId);
    if (idea) {
      setInterestIdea(idea);
    }
  };

  if (isLoading) {
    return (
      <PageShell
        hero={
          <PageHeader
            badge={{ variant: "brand", icon: Lightbulb, label: tIdeas("title") }}
            icon={<Lightbulb className="h-5 w-5" />}
            title={tIdeas("title")}
            description={tIdeas("subtitle")}
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
          badge={{ variant: "brand", icon: Lightbulb, label: tIdeas("title") }}
          icon={<Lightbulb className="h-5 w-5" />}
          title={tIdeas("title")}
          description={tIdeas("subtitle")}
          actions={
            <Link href="/ideas/new">
              <Button variant="solana" className="gap-2">
                <Plus className="h-4 w-4" />
                {tIdeas("postIdea")}
              </Button>
            </Link>
          }
        />
      }
    >
      <MarketplaceShell
        filters={
          <FilterCard
            title={tIdeas("title")}
            description={tIdeas("searchPlaceholder")}
            className="marketplace-panel"
          >
            <div className="relative">
              <Search
                className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${searchIconClass}`}
              />
              <Input
                placeholder={tIdeas("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={searchInputClass}
              />
            </div>
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">{tIdeas("stage")}</span>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={`marketplace-pill cursor-pointer ${selectedStage === null ? "border-border bg-card text-foreground" : ""}`}
                  onClick={() => setSelectedStage(null)}
                >
                  {tIdeas("allIdeas")}
                </Badge>
                <Badge
                  variant="outline"
                  className={`marketplace-pill cursor-pointer ${selectedStage === "idea" ? "border-border bg-card text-foreground" : ""}`}
                  onClick={() => setSelectedStage("idea")}
                >
                  <Lightbulb className="h-3 w-3" />
                  {tIdeas("ideaStage")}
                </Badge>
                <Badge
                  variant="outline"
                  className={`marketplace-pill cursor-pointer ${selectedStage === "mvp" ? "border-border bg-card text-foreground" : ""}`}
                  onClick={() => setSelectedStage("mvp")}
                >
                  {tIdeas("mvp")}
                </Badge>
                <Badge
                  variant="outline"
                  className={`marketplace-pill cursor-pointer ${selectedStage === "launched" ? "border-border bg-card text-foreground" : ""}`}
                  onClick={() => setSelectedStage("launched")}
                >
                  {tIdeas("launched")}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">{tIdeas("lookingFor")}</span>
              <div className="flex flex-wrap gap-2">
                {availableRoles.slice(0, 8).map((role) => (
                  <Badge
                    key={role}
                    variant="outline"
                    className={`marketplace-pill cursor-pointer ${selectedRole === role ? "border-border bg-card text-foreground" : ""}`}
                    onClick={() => setSelectedRole(selectedRole === role ? null : role)}
                  >
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </FilterCard>
        }
        toolbar={
          <FilterBar
            sticky
            resultsSlot={`${filteredIdeas.length} · ${tIdeas("title")}`}
            segmentsSlot={
              <SegmentedFilter
                ariaLabel={tIdeas("stage")}
                value={selectedStage ?? "all"}
                onValueChange={(value) => setSelectedStage(value === "all" ? null : value)}
                options={[
                  { value: "all", label: tIdeas("allIdeas") },
                  { value: "idea", label: tIdeas("ideaStage") },
                  { value: "mvp", label: tIdeas("mvp") },
                  { value: "launched", label: tIdeas("launched") },
                ]}
              />
            }
          />
        }
        hasResults={filteredIdeas.length > 0}
        empty={
          <PremiumEmptyState
            icon={Lightbulb}
            title={t("noResults")}
            description={tIdeas("searchPlaceholder")}
            action={
              <>
                <Button type="button" variant="outline" onClick={() => { setSearch(""); setSelectedRole(null); setSelectedStage(null); }}>
                  {t("clear")}
                </Button>
                <Link href="/ideas/new">
                  <Button type="button">{tIdeas("postIdea")}</Button>
                </Link>
              </>
            }
          />
        }
        content={
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onExpressInterest={handleExpressInterest}
              />
            ))}
          </div>
        }
      />

      {/* Interest Modal */}
      {interestIdea && (
        <InterestModal
          ideaId={interestIdea.id}
          ideaTitle={interestIdea.title}
          isOpen={!!interestIdea}
          onClose={() => setInterestIdea(null)}
          onSubmit={async (data) => {
            const res = await fetch(`/api/ideas/${data.ideaId}/interest`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                role: interestRoleMap[data.role] ?? "developer",
                message: data.message,
              }),
            });
            if (!res.ok) {
              throw new Error(`Failed to submit interest (${res.status})`);
            }
            setIdeas((prev) =>
              prev.map((idea) =>
                idea.id === data.ideaId
                  ? { ...idea, interestedCount: idea.interestedCount + 1 }
                  : idea
              )
            );
          }}
        />
      )}
    </PageShell>
  );
}
