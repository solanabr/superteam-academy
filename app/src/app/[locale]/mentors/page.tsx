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
import { MentorCard, type Mentor } from "@/components/mentors/MentorCard";
import { getLocaleDirection } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/request";
import { Search, UserPlus, Loader2, DollarSign } from "lucide-react";

type ApiMentor = {
  id: string;
  bio: string;
  expertise: string[];
  hourlyRate?: number | null;
  rating: number;
  totalSessions: number;
  isVerified?: boolean;
  user?: {
    id?: string | null;
    displayName?: string | null;
    username?: string | null;
    avatarUrl?: string | null;
  };
};

function formatIdentity(value?: string | null): string | undefined {
  return value ? `${value.slice(0, 8)}...` : undefined;
}

function mapMentor(mentor: ApiMentor): Mentor {
  const availability: Mentor["availability"] =
    mentor.hourlyRate == null ? "unavailable" : mentor.isVerified ? "available" : "limited";
  const displayName =
    mentor.user?.displayName ||
    mentor.user?.username ||
    formatIdentity(mentor.user?.id ?? mentor.id) ||
    mentor.id;

  return {
    id: mentor.id,
    name: displayName,
    avatar: mentor.user?.avatarUrl || undefined,
    bio: mentor.bio,
    expertise: mentor.expertise,
    hourlyRate: mentor.hourlyRate ?? undefined,
    currency: "USDC",
    rating: mentor.rating || 0,
    totalSessions: mentor.totalSessions,
    availability,
  };
}

export default function MentorsPage() {
  const t = useTranslations("common");
  const tMentors = useTranslations("mentors");
  const locale = useLocale();
  const isRtl = getLocaleDirection(locale as Locale) === "rtl";
  const searchIconClass = isRtl ? "right-3" : "left-3";
  const searchInputClass = isRtl ? "pr-10" : "pl-10";

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);

  useEffect(() => {
    async function fetchMentors() {
      try {
        const res = await fetch("/api/mentors", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Failed to load mentors (${res.status})`);
        }
        const data = (await res.json()) as { mentors?: ApiMentor[] };
        setMentors((data.mentors ?? []).map(mapMentor));
      } catch (error) {
        console.error("Failed to fetch mentors:", error);
        setMentors([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMentors();
  }, []);

  const availableExpertise = useMemo(() => {
    const expertise = new Set<string>();
    mentors.forEach((m) => m.expertise.forEach((e) => expertise.add(e)));
    return Array.from(expertise).sort();
  }, [mentors]);

  const filteredMentors = useMemo(() => {
    return mentors.filter((mentor) => {
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          mentor.name.toLowerCase().includes(searchLower) ||
          mentor.bio.toLowerCase().includes(searchLower) ||
          mentor.expertise.some((e) => e.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      if (selectedExpertise && !mentor.expertise.includes(selectedExpertise)) {
        return false;
      }

      if (priceRange) {
        if (
          mentor.hourlyRate == null ||
          mentor.hourlyRate < priceRange[0] ||
          mentor.hourlyRate > priceRange[1]
        ) {
          return false;
        }
      }

      return true;
    });
  }, [mentors, search, selectedExpertise, priceRange]);

  if (isLoading) {
    return (
      <PageShell
        hero={
          <PageHeader
            badge={{ variant: "brand", icon: UserPlus, label: tMentors("title") }}
            icon={<UserPlus className="h-5 w-5" />}
            title={tMentors("title")}
            description={tMentors("subtitle")}
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
          badge={{ variant: "brand", icon: UserPlus, label: tMentors("title") }}
          icon={<UserPlus className="h-5 w-5" />}
          title={tMentors("title")}
          description={tMentors("subtitle")}
          actions={
            <>
              <Link href="/mentors/become">
                <Button variant="outline" className="gap-2 rounded-xl">
                  <UserPlus className="h-4 w-4" />
                  {tMentors("becomeMentor")}
                </Button>
              </Link>
              <Link href="/sessions">
                <Button variant="outline" className="rounded-xl">My Sessions</Button>
              </Link>
            </>
          }
        />
      }
    >
      <MarketplaceShell
        filters={
          <FilterCard
            title={tMentors("title")}
            description={tMentors("searchPlaceholder")}
            className="marketplace-panel"
          >
            <div className="relative">
              <Search
                className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${searchIconClass}`}
              />
              <Input
                placeholder={tMentors("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={searchInputClass}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Price</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPriceRange(null)}
                  className={`marketplace-pill ${priceRange === null ? "border-border bg-card text-foreground" : ""}`}
                >
                  {t("viewAll")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPriceRange([0, 100])}
                  className={`marketplace-pill ${priceRange?.[0] === 0 && priceRange?.[1] === 100 ? "border-border bg-card text-foreground" : ""}`}
                >
                  Under $100
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPriceRange([100, 200])}
                  className={`marketplace-pill ${priceRange?.[0] === 100 && priceRange?.[1] === 200 ? "border-border bg-card text-foreground" : ""}`}
                >
                  $100 - $200
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPriceRange([200, 1000])}
                  className={`marketplace-pill ${priceRange?.[0] === 200 ? "border-border bg-card text-foreground" : ""}`}
                >
                  $200+
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={`marketplace-pill cursor-pointer ${selectedExpertise === null ? "border-border bg-card text-foreground" : ""}`}
                onClick={() => setSelectedExpertise(null)}
              >
                {t("viewAll")}
              </Badge>
              {availableExpertise.map((expertise) => (
                <Badge
                  key={expertise}
                  variant="outline"
                  className={`marketplace-pill cursor-pointer ${selectedExpertise === expertise ? "border-border bg-card text-foreground" : ""}`}
                  onClick={() =>
                    setSelectedExpertise(expertise === selectedExpertise ? null : expertise)
                  }
                >
                  {expertise}
                </Badge>
              ))}
            </div>
          </FilterCard>
        }
        toolbar={
          <FilterBar
            sticky
            resultsSlot={`${filteredMentors.length} · ${tMentors("title")}`}
            segmentsSlot={
              <SegmentedFilter
                ariaLabel={tMentors("availability")}
                value={
                  priceRange === null
                    ? "all"
                    : priceRange[1] <= 100
                      ? "under-100"
                      : priceRange[0] >= 100 && priceRange[1] <= 200
                        ? "100-200"
                        : "200-plus"
                }
                onValueChange={(value) => {
                  if (value === "all") setPriceRange(null);
                  if (value === "under-100") setPriceRange([0, 100]);
                  if (value === "100-200") setPriceRange([100, 200]);
                  if (value === "200-plus") setPriceRange([200, 1000]);
                }}
                options={[
                  { value: "all", label: t("viewAll") },
                  { value: "under-100", label: "Under $100" },
                  { value: "100-200", label: "$100 - $200" },
                  { value: "200-plus", label: "$200+" },
                ]}
              />
            }
          />
        }
        hasResults={filteredMentors.length > 0}
        empty={
          <PremiumEmptyState
            icon={UserPlus}
            title={t("noResults")}
            description={tMentors("searchPlaceholder")}
            action={
              <>
                <Button type="button" variant="outline" onClick={() => { setSearch(""); setSelectedExpertise(null); setPriceRange(null); }}>
                  {t("clear")}
                </Button>
                <Link href="/mentors/become">
                  <Button type="button">{tMentors("becomeMentor")}</Button>
                </Link>
              </>
            }
          />
        }
        content={
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredMentors.map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))}
          </div>
        }
      />
    </PageShell>
  );
}
