"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/ui/filter-bar";
import { MarketplaceShell } from "@/components/ui/marketplace-shell";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { PremiumEmptyState } from "@/components/ui/premium-empty-state";
import { SegmentedFilter } from "@/components/ui/segmented-filter";
import { Skeleton } from "@/components/ui/skeleton";
import { JobCard, type Job } from "@/components/jobs/JobCard";
import { JobFilters, type JobFiltersState } from "@/components/jobs/JobFilters";
import { Search, Briefcase } from "lucide-react";
import { formatRelativeDate, parseSalaryRange } from "@/lib/feature-ui";

type ApiJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salaryRange?: string | null;
  skills: string[];
  experience: string;
  createdAt: string;
  description: string;
};

function mapJob(job: ApiJob): Job {
  const salary = parseSalaryRange(job.salaryRange);
  const type = ["full-time", "part-time", "contract", "freelance", "internship"].includes(job.type)
    ? (job.type as Job["type"])
    : "contract";
  const experienceMap: Record<string, Job["experience"]> = {
    junior: "entry",
    mid: "mid",
    senior: "senior",
    lead: "lead",
  };

  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    type,
    ...salary,
    skills: job.skills,
    experience: experienceMap[job.experience] ?? "mid",
    postedAt: formatRelativeDate(job.createdAt),
    description: job.description,
  };
}

export default function JobsPage() {
  const t = useTranslations("common");
  const tJobs = useTranslations("jobs");
  const tCourses = useTranslations("courses");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<JobFiltersState>({
    search: "",
    skills: [],
    experience: [],
    location: [],
    type: [],
  });
  const [sortBy, setSortBy] = useState<"recent" | "company" | "salary">("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch("/api/jobs", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Failed to load jobs (${res.status})`);
        }
        const data = (await res.json()) as { jobs?: ApiJob[] };
        setJobs((data.jobs ?? []).map(mapJob));
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchJobs();
  }, []);

  const availableSkills = useMemo(() => {
    const skills = new Set<string>();
    jobs.forEach((job) => job.skills.forEach((skill) => skills.add(skill)));
    return Array.from(skills).sort();
  }, [jobs]);

  const availableLocations = useMemo(() => {
    const locations = new Set<string>();
    jobs.forEach((job) => locations.add(job.location));
    return Array.from(locations).sort();
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          job.title.toLowerCase().includes(searchLower) ||
          job.company.toLowerCase().includes(searchLower) ||
          job.skills.some((skill) => skill.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Experience filter
      if (filters.experience.length > 0 && !filters.experience.includes(job.experience)) {
        return false;
      }

      // Type filter
      if (filters.type.length > 0 && !filters.type.includes(job.type)) {
        return false;
      }

      // Skills filter
      if (filters.skills.length > 0) {
        const hasMatchingSkill = filters.skills.some((skill) =>
          job.skills.includes(skill)
        );
        if (!hasMatchingSkill) return false;
      }

      // Location filter
      if (filters.location.length > 0 && !filters.location.includes(job.location)) {
        return false;
      }

      return true;
    });
  }, [jobs, filters]);

  const sortedJobs = useMemo(() => {
    const next = [...filteredJobs];

    next.sort((a, b) => {
      if (sortBy === "company") {
        return a.company.localeCompare(b.company);
      }
      if (sortBy === "salary") {
        return (b.salaryMax ?? b.salaryMin ?? 0) - (a.salaryMax ?? a.salaryMin ?? 0);
      }
      return 0;
    });

    return next;
  }, [filteredJobs, sortBy]);

  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedJobs.slice(start, start + itemsPerPage);
  }, [sortedJobs, currentPage]);

  const totalPages = Math.ceil(sortedJobs.length / itemsPerPage);

  if (isLoading) {
    return (
      <PageShell
        hero={
          <PageHeader
            badge={{ variant: "brand", icon: Briefcase, label: tJobs("title") }}
            title={tJobs("title")}
            description={tJobs("subtitle")}
          />
        }
      >
        <MarketplaceShell
          isLoading
          filters={<Skeleton className="h-[480px] rounded-[1.5rem]" />}
          toolbar={<Skeleton className="h-16 rounded-[1.25rem]" />}
          loading={
            <div className="space-y-4">
              <Skeleton className="h-36 rounded-[1.5rem]" />
              <Skeleton className="h-36 rounded-[1.5rem]" />
              <Skeleton className="h-36 rounded-[1.5rem]" />
            </div>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      hero={
        <PageHeader
          badge={{ variant: "brand", icon: Briefcase, label: tJobs("title") }}
          title={tJobs("title")}
          description={tJobs("subtitle")}
          actions={
            <Link href="/jobs/new">
              <Button variant="default" className="gap-2 rounded-xl">
                <Briefcase className="h-4 w-4" />
                {tJobs("postJob")}
              </Button>
            </Link>
          }
        />
      }
    >
      <MarketplaceShell
        filters={
          <JobFilters
            filters={filters}
            onChange={setFilters}
            availableSkills={availableSkills}
            availableLocations={availableLocations}
          />
        }
        toolbar={
          <FilterBar
            sticky
            resultsSlot={
              <div className="flex flex-wrap items-center gap-2">
                <span>{filteredJobs.length} · {tJobs("title")}</span>
                {filteredJobs.length > 0 ? (
                  <span className="brand-pill px-2 py-0.5 text-xs text-muted-foreground">
                    {currentPage}/{totalPages}
                  </span>
                ) : null}
              </div>
            }
            segmentsSlot={
              <SegmentedFilter
                ariaLabel={tJobs("jobType")}
                value={sortBy}
                onValueChange={(value) => setSortBy(value as "recent" | "company" | "salary")}
                options={[
                  { value: "recent", label: tCourses("sortNewest") },
                  { value: "company", label: tJobs("form.company") },
                  { value: "salary", label: tJobs("salary") },
                ]}
              />
            }
          />
        }
        hasResults={filteredJobs.length > 0}
        empty={
          <PremiumEmptyState
            icon={Search}
            title={t("noResults")}
            description={tJobs("searchPlaceholder")}
            action={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setFilters({
                      search: "",
                      skills: [],
                      experience: [],
                      location: [],
                      type: [],
                    })
                  }
                >
                  {t("clear")}
                </Button>
                <Link href="/jobs/new">
                  <Button type="button">{tJobs("postJob")}</Button>
                </Link>
              </>
            }
          />
        }
        content={
          <>
            <div className="grid gap-4" data-testid="jobs-layout">
              {paginatedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
            {totalPages > 1 ? (
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {t("previous")}
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {t("next")}
                </Button>
              </div>
            ) : null}
          </>
        }
      />
    </PageShell>
  );
}
