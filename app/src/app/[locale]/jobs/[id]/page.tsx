"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard, LuxuryBadge } from "@/components/luxury/primitives";
import { JobApplicationModal } from "@/components/jobs/JobApplicationModal";
import { SkillMatchBadge } from "@/components/jobs/SkillMatchBadge";
import { formatRelativeDate, parseSalaryRange } from "@/lib/feature-ui";
import {
  MapPin,
  DollarSign,
  Building2,
  Clock,
  Briefcase,
  ArrowLeft,
  ExternalLink,
  Share2,
  Loader2,
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  company: string;
  companyDescription?: string;
  companyWebsite?: string;
  location: string;
  type: "full-time" | "part-time" | "contract" | "freelance" | "internship";
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  skills: string[];
  experience: "entry" | "mid" | "senior" | "lead";
  postedAt: string;
  description: string;
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
}

type ApiJob = {
  id: string;
  title: string;
  company: string;
  companyLogo?: string | null;
  location: string;
  type: string;
  salaryRange?: string | null;
  skills: string[];
  experience: string;
  createdAt: string;
  description: string;
  applicantCount?: number;
  hasApplied?: boolean;
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

const experienceLabels: Record<string, string> = {
  entry: "Entry Level",
  mid: "Mid Level",
  senior: "Senior",
  lead: "Lead",
};

const typeLabels: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  freelance: "Freelance",
  internship: "Internship",
};

export default function JobDetailPage() {
  const t = useTranslations("common");
  const tJobs = useTranslations("jobs");
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);

  useEffect(() => {
    // Simulate API call
    async function fetchJob() {
      try {
        const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Failed to load job (${res.status})`);
        }
        const data = (await res.json()) as { job?: ApiJob };
        const currentJob = data.job ? mapJob(data.job) : null;
        setJob(currentJob);

        if (currentJob) {
          const related = await fetch(
            `/api/jobs?skills=${encodeURIComponent(currentJob.skills.slice(0, 3).join(","))}&limit=6`,
            { cache: "no-store" }
          );
          if (related.ok) {
            const relatedData = (await related.json()) as { jobs?: ApiJob[] };
            setSimilarJobs(
              (relatedData.jobs ?? [])
                .map(mapJob)
                .filter((item) => item.id !== currentJob.id)
                .slice(0, 3)
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch job:", error);
        setJob(null);
        setSimilarJobs([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchJob();
  }, [id]);

  const formatSalary = (job: Job) => {
    if (!job.salaryMin && !job.salaryMax) return "Not specified";
    const currency = job.salaryCurrency || "USD";
    const min = job.salaryMin?.toLocaleString();
    const max = job.salaryMax?.toLocaleString();
    if (min && max) return `${currency} ${min} - ${max}`;
    if (min) return `${currency} ${min}+`;
    if (max) return `Up to ${currency} ${max}`;
    return "Not specified";
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container py-8">
        <GlassCard className="py-16 text-center">
          <p className="text-lg text-muted-foreground">Job not found</p>
          <Link href="/jobs">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-10">
      {/* Back button */}
      <Link href="/jobs">
        <Button variant="ghost" className="mb-6 -ml-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("back")}
        </Button>
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <GlassCard glowColor="emerald">
            <div className="p-6 md:p-8">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <LuxuryBadge color="emerald">Role Feed</LuxuryBadge>
                <Badge variant="outline" className="border-primary/30 bg-primary/10">
                  Live listing
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="outline">{typeLabels[job.type]}</Badge>
                <Badge variant="secondary">{experienceLabels[job.experience]}</Badge>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
              <div className="flex items-center gap-2 mt-2 text-lg text-muted-foreground">
                <Building2 className="h-5 w-5" />
                {job.company}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {formatSalary(job)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Posted {job.postedAt}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About the Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">{job.description}</p>

              {job.requirements?.length ? (
                <div>
                  <h3 className="font-semibold mb-3">Requirements</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {job.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {job.responsibilities?.length ? (
                <div>
                  <h3 className="font-semibold mb-3">Responsibilities</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {job.responsibilities.map((resp, i) => (
                      <li key={i}>{resp}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {job.benefits?.length ? (
                <div>
                  <h3 className="font-semibold mb-3">Benefits</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {job.benefits.map((benefit, i) => (
                      <li key={i}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div>
                <h3 className="font-semibold mb-3">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Similar Jobs */}
          {similarJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Similar Jobs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {similarJobs.map((similarJob) => (
                  <Link key={similarJob.id} href={`/jobs/${similarJob.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div>
                        <h4 className="font-medium">{similarJob.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {similarJob.company} • {similarJob.location}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {similarJob.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge variant="secondary">{formatSalary(similarJob)}</Badge>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Apply Card */}
          <GlassCard glowColor="emerald">
            <div className="p-6">
              <Button
                size="lg"
                className="w-full"
                variant="solana"
                onClick={() => setIsApplyModalOpen(true)}
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Apply Now
              </Button>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" className="flex-1" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                {job.companyWebsite ? (
                  <Button asChild variant="outline" className="flex-1" size="sm">
                    <a href={job.companyWebsite} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Website
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          </GlassCard>

          {job.companyDescription || job.companyWebsite ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About {job.company}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.companyDescription ? (
                  <p className="text-sm text-muted-foreground">{job.companyDescription}</p>
                ) : null}
                {job.companyWebsite ? (
                  <a
                    href={job.companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Visit website
                  </a>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {/* Job Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Experience</span>
                <span className="font-medium">{experienceLabels[job.experience]}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Job Type</span>
                <span className="font-medium">{typeLabels[job.type]}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium">{job.location}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Posted</span>
                <span className="font-medium">{job.postedAt}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <JobApplicationModal
        jobId={job.id}
        jobTitle={job.title}
        company={job.company}
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSubmit={async (application) => {
          await fetch(`/api/jobs/${job.id}/apply`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(application),
          });
        }}
      />
    </div>
  );
}
