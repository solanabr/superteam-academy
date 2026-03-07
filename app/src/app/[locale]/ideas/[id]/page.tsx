"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard, LuxuryBadge } from "@/components/luxury/primitives";
import { IdeaStageBadge } from "@/components/ideas/IdeaStageBadge";
import { InterestModal } from "@/components/ideas/InterestModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeDate } from "@/lib/feature-ui";
import {
  Users,
  ArrowLeft,
  Share2,
  Target,
  Rocket,
  Loader2,
} from "lucide-react";
import type { Idea } from "@/components/ideas/IdeaCard";
type PageIdea = Idea & {
  fullProblem: string;
  fullSolution: string;
  teamMembers: { name: string; role: string }[];
};

type ApiIdea = {
  id: string;
  title: string;
  description: string;
  problem: string;
  solution: string;
  stage: string;
  lookingFor: string[];
  createdAt: string;
  owner?: {
    id?: string | null;
    displayName?: string | null;
    username?: string | null;
  };
  interested?: Array<{
    id: string;
    role: string;
    user?: {
      id?: string | null;
      displayName?: string | null;
      username?: string | null;
    };
  }>;
};

function prettifyRole(value: string): string {
  return value
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatIdentity(value?: string | null): string | undefined {
  return value ? `${value.slice(0, 8)}...` : undefined;
}

function mapIdea(idea: ApiIdea): PageIdea {
  const stage = ["idea", "mvp", "launched"].includes(idea.stage)
    ? (idea.stage as Idea["stage"])
    : "idea";
  const authorName =
    idea.owner?.displayName || idea.owner?.username || formatIdentity(idea.owner?.id);

  return {
    id: idea.id,
    title: idea.title,
    problem: idea.problem,
    fullProblem: idea.problem,
    solution: idea.solution,
    fullSolution: idea.solution,
    stage,
    lookingFor: idea.lookingFor.map(prettifyRole),
    skillsNeeded: idea.lookingFor.map(prettifyRole),
    author: authorName ? { name: authorName } : undefined,
    interestedCount: idea.interested?.length ?? 0,
    createdAt: formatRelativeDate(idea.createdAt),
    teamMembers: (idea.interested ?? [])
      .slice(0, 4)
      .map((entry) => {
        const name =
          entry.user?.displayName ||
          entry.user?.username ||
          formatIdentity(entry.user?.id);

        return name
          ? {
              name,
              role: prettifyRole(entry.role),
            }
          : null;
      })
      .filter((member): member is PageIdea["teamMembers"][number] => member !== null),
  };
}

export default function IdeaDetailPage() {
  const t = useTranslations("common");
  const { id } = useParams();
  const [idea, setIdea] = useState<PageIdea | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);

  useEffect(() => {
    async function fetchIdea() {
      try {
        const res = await fetch(`/api/ideas/${id}`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Failed to load idea (${res.status})`);
        }
        const data = (await res.json()) as { idea?: ApiIdea };
        setIdea(data.idea ? mapIdea(data.idea) : null);
      } catch (error) {
        console.error("Failed to fetch idea:", error);
        setIdea(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchIdea();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="container py-8">
        <GlassCard className="py-16 text-center">
          <p className="text-lg text-muted-foreground">Idea not found</p>
          <Link href="/ideas">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Ideas
            </Button>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-10">
      {/* Back button */}
      <Link href="/ideas">
        <Button variant="ghost" className="mb-6 -ml-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("back")}
        </Button>
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <GlassCard glowColor="blue">
            <div className="p-6 md:p-8">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <LuxuryBadge color="blue">Idea Radar</LuxuryBadge>
                <Badge variant="outline" className="border-primary/30 bg-primary/10">
                  Live opportunity
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <IdeaStageBadge stage={idea.stage} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{idea.title}</h1>
              {idea.author ? (
                <div className="flex items-center gap-2 mt-4">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{idea.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground">by {idea.author.name}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{idea.createdAt}</span>
                </div>
              ) : (
                <div className="mt-4 text-sm text-muted-foreground">{idea.createdAt}</div>
              )}
            </div>
          </GlassCard>

          {/* Problem */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-red-500" />
                The Problem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                {idea.fullProblem.split("\n").map((paragraph, i) =>
                  paragraph.trim() ? (
                    <p key={i} className="text-muted-foreground">
                      {paragraph}
                    </p>
                  ) : null
                )}
              </div>
            </CardContent>
          </Card>

          {/* Solution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-green-500" />
                The Solution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                {idea.fullSolution.split("\n").map((paragraph, i) =>
                  paragraph.trim() ? (
                    <p key={i} className="text-muted-foreground">
                      {paragraph}
                    </p>
                  ) : null
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team */}
          {idea.teamMembers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Current Team</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {idea.teamMembers.map((member, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <GlassCard glowColor="blue">
            <div className="p-6">
              <Button
                className="w-full mb-3"
                size="lg"
                variant="solana"
                onClick={() => setIsInterestModalOpen(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                I&apos;m Interested
              </Button>
              <Button variant="outline" className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Share Idea
              </Button>
            </div>
          </GlassCard>

          {/* Looking For */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Looking For
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {idea.lookingFor.map((role) => (
                  <Badge key={role} variant="secondary">
                    {role}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Skills Needed */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Skills Needed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {idea.skillsNeeded.map((skill) => (
                  <Badge key={skill} variant="outline">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Interested
                </span>
                <span className="font-medium">{idea.interestedCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Size
                </span>
                <span className="font-medium">{idea.teamMembers.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Interest Modal */}
      <InterestModal
        ideaId={idea.id}
        ideaTitle={idea.title}
        isOpen={isInterestModalOpen}
        onClose={() => setIsInterestModalOpen(false)}
        onSubmit={async (data) => {
          const roleMap: Record<string, "developer" | "designer" | "advisor" | "marketer" | "investor"> = {
            developer: "developer",
            designer: "designer",
            "product-manager": "advisor",
            marketing: "marketer",
            "business-development": "advisor",
            investor: "investor",
            other: "advisor",
          };
          await fetch(`/api/ideas/${idea.id}/interest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: roleMap[data.role] ?? "developer",
              message: data.message,
            }),
          });
        }}
      />
    </div>
  );
}
