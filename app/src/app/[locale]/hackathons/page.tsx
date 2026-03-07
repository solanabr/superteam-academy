"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterBar } from "@/components/ui/filter-bar";
import { SegmentedFilter } from "@/components/ui/segmented-filter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterCard } from "@/components/ui/filter-card";
import { MarketplaceCard } from "@/components/ui/marketplace-card";
import { MarketplaceShell } from "@/components/ui/marketplace-shell";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { PremiumEmptyState } from "@/components/ui/premium-empty-state";
import { HackathonCard, type Hackathon } from "@/components/hackathons/HackathonCard";
import { EventsCalendar } from "@/components/hackathons/EventsCalendar";
import { Calendar, List, MapPin, Loader2 } from "lucide-react";

type ApiHackathon = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  prizes?: string | null;
  tags: string[];
};

function mapHackathon(event: ApiHackathon): Hackathon {
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const now = Date.now();
  let status: Hackathon["status"] = "upcoming";

  if (startDate.getTime() <= now && endDate.getTime() >= now) {
    status = "live";
  } else if (endDate.getTime() < now) {
    status = "ended";
  }

  return {
    id: event.id,
    name: event.title,
    description: event.description,
    startDate,
    endDate,
    location: event.location,
    prizes: event.prizes || undefined,
    tags: event.tags,
    status,
  };
}

export default function HackathonsPage() {
  const t = useTranslations("common");
  const tHackathons = useTranslations("hackathons");

  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [filterType, setFilterType] = useState<"all" | "virtual" | "physical">("all");

  useEffect(() => {
    async function fetchHackathons() {
      try {
        const res = await fetch("/api/hackathons?upcoming=false", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Failed to load hackathons (${res.status})`);
        }
        const data = (await res.json()) as { events?: ApiHackathon[] };
        setHackathons((data.events ?? []).map(mapHackathon));
      } catch (error) {
        console.error("Failed to fetch hackathons:", error);
        setHackathons([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHackathons();
  }, []);

  const filteredHackathons = useMemo(() => {
    return hackathons.filter((h) => {
      if (filterType === "virtual") return h.location === "virtual";
      if (filterType === "physical") return h.location !== "virtual";
      return true;
    });
  }, [hackathons, filterType]);

  const upcomingHackathons = filteredHackathons.filter((h) => h.status === "upcoming");
  const liveHackathons = filteredHackathons.filter((h) => h.status === "live");
  const pastHackathons = filteredHackathons.filter((h) => h.status === "ended");

  if (isLoading) {
    return (
      <PageShell
        hero={
          <PageHeader
            badge={{ variant: "brand", icon: Calendar, label: tHackathons("title") }}
            icon={<Calendar className="h-5 w-5" />}
            title={tHackathons("title")}
            description={tHackathons("subtitle")}
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
          badge={{ variant: "brand", icon: Calendar, label: tHackathons("title") }}
          icon={<Calendar className="h-5 w-5" />}
          title={tHackathons("title")}
          description={tHackathons("subtitle")}
        />
      }
    >
      <MarketplaceShell
        filters={
          <FilterCard
            title={tHackathons("title")}
            description={tHackathons("subtitle")}
            className="marketplace-panel"
          >
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={`marketplace-pill cursor-pointer ${filterType === "all" ? "border-border bg-card text-foreground" : ""}`}
                onClick={() => setFilterType("all")}
              >
                {tHackathons("allEvents")}
              </Badge>
              <Badge
                variant="outline"
                className={`marketplace-pill cursor-pointer ${filterType === "virtual" ? "border-border bg-card text-foreground" : ""}`}
                onClick={() => setFilterType("virtual")}
              >
                {tHackathons("virtual")}
              </Badge>
              <Badge
                variant="outline"
                className={`marketplace-pill cursor-pointer ${filterType === "physical" ? "border-border bg-card text-foreground" : ""}`}
                onClick={() => setFilterType("physical")}
              >
                <MapPin className="h-3 w-3" />
                {tHackathons("inPerson")}
              </Badge>
            </div>
          </FilterCard>
        }
        toolbar={
          <FilterBar
            sticky
            resultsSlot={`${filteredHackathons.length} · ${tHackathons("title")}`}
            segmentsSlot={
              <SegmentedFilter
                ariaLabel={tHackathons("listView")}
                value={viewMode}
                onValueChange={(value) => setViewMode(value as "list" | "calendar")}
                options={[
                  {
                    value: "list",
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <List className="h-4 w-4" />
                        {tHackathons("listView")}
                      </span>
                    ),
                  },
                  {
                    value: "calendar",
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {tHackathons("calendarView")}
                      </span>
                    ),
                  },
                ]}
              />
            }
            actionsSlot={
              <SegmentedFilter
                ariaLabel={tHackathons("allEvents")}
                value={filterType}
                onValueChange={(value) => setFilterType(value as "all" | "virtual" | "physical")}
                options={[
                  { value: "all", label: tHackathons("allEvents") },
                  { value: "virtual", label: tHackathons("virtual") },
                  { value: "physical", label: tHackathons("inPerson") },
                ]}
              />
            }
          />
        }
        content={
          viewMode === "calendar" ? (
            <MarketplaceCard accent>
              <EventsCalendar
                hackathons={filteredHackathons}
              />
            </MarketplaceCard>
          ) : (
            <MarketplaceCard accent className="p-4">
              <Tabs defaultValue="upcoming" className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="upcoming">
                    Upcoming
                    {upcomingHackathons.length > 0 ? (
                      <span className="ms-1 rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-xs">
                        {upcomingHackathons.length}
                      </span>
                    ) : null}
                  </TabsTrigger>
                  <TabsTrigger value="live">
                    Live Now
                    {liveHackathons.length > 0 ? (
                      <span className="ms-1 rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-xs">
                        {liveHackathons.length}
                      </span>
                    ) : null}
                  </TabsTrigger>
                  <TabsTrigger value="past">Past</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="space-y-6">
                  {upcomingHackathons.length === 0 ? (
                    <PremiumEmptyState
                      icon={Calendar}
                      title={t("noResults")}
                      description={tHackathons("subtitle")}
                      action={<Button type="button" variant="outline" onClick={() => setFilterType("all")}>{t("clear")}</Button>}
                    />
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {upcomingHackathons.map((hackathon) => (
                        <HackathonCard
                          key={hackathon.id}
                          hackathon={hackathon}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="live" className="space-y-6">
                  {liveHackathons.length === 0 ? (
                    <PremiumEmptyState
                      icon={List}
                      title={t("noResults")}
                      description={tHackathons("subtitle")}
                      action={<Button type="button" variant="outline" onClick={() => setFilterType("all")}>{t("clear")}</Button>}
                    />
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {liveHackathons.map((hackathon) => (
                        <HackathonCard
                          key={hackathon.id}
                          hackathon={hackathon}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="past" className="space-y-6">
                  {pastHackathons.length === 0 ? (
                    <PremiumEmptyState
                      icon={Calendar}
                      title={t("noResults")}
                      description={tHackathons("subtitle")}
                      action={<Button type="button" variant="outline" onClick={() => setFilterType("all")}>{t("clear")}</Button>}
                    />
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {pastHackathons.map((hackathon) => (
                        <HackathonCard
                          key={hackathon.id}
                          hackathon={hackathon}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </MarketplaceCard>
          )
        }
      />
    </PageShell>
  );
}
