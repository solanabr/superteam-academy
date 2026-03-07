"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard, LuxuryBadge } from "@/components/luxury/primitives";
import { FeedbackSection, type Feedback } from "@/components/projects/FeedbackSection";
import { BadgeDisplay, type Badge as ProjectBadge } from "@/components/projects/BadgeDisplay";
import { Heart, Eye, ExternalLink, Github, ArrowLeft, Share2, Loader2 } from "lucide-react";
import { formatRelativeDate } from "@/lib/feature-ui";

interface Project {
  id: string;
  title: string;
  description: string;
  fullDescription?: string;
  thumbnail?: string;
  images?: string[];
  tags: string[];
  likes: number;
  views: number;
  author?: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  demoUrl?: string;
  repoUrl?: string;
  createdAt: string;
  badges?: ProjectBadge[];
}
type ApiProject = {
  id: string;
  title: string;
  description: string;
  thumbnail?: string | null;
  tags: string[];
  likes: number;
  views: number;
  demoUrl?: string | null;
  githubUrl?: string | null;
  createdAt: string;
  owner?: {
    id?: string;
    displayName?: string | null;
    username?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
  };
  feedback?: Array<{
    id: string;
    rating: number;
    content: string;
    createdAt: string;
    author?: {
      id?: string | null;
      displayName?: string | null;
      username?: string | null;
      avatarUrl?: string | null;
    };
  }>;
  badges?: Array<{
    id: string;
    badgeType: string;
    awardedAt: string;
  }>;
};

function formatIdentity(value?: string | null): string | undefined {
  return value ? `${value.slice(0, 8)}...` : undefined;
}

function mapProject(project: ApiProject): Project {
  const authorName =
    project.owner?.displayName || project.owner?.username || formatIdentity(project.owner?.id);

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    fullDescription: project.description,
    thumbnail: project.thumbnail || undefined,
    tags: project.tags,
    likes: project.likes,
    views: project.views,
    author: authorName
      ? {
          name: authorName,
          avatar: project.owner?.avatarUrl || undefined,
          bio: project.owner?.bio || undefined,
        }
      : undefined,
    demoUrl: project.demoUrl || undefined,
    repoUrl: project.githubUrl || undefined,
    createdAt: formatRelativeDate(project.createdAt),
    badges: (project.badges ?? []).map((badge) => ({
      id: badge.id,
      name: badge.badgeType.replace(/_/g, " "),
      description: `Awarded for ${badge.badgeType.replace(/_/g, " ")}`,
      icon: "star",
      color: "purple",
      earnedAt: badge.awardedAt,
    })),
  };
}

function mapFeedback(project: ApiProject): Feedback[] {
  return (project.feedback ?? []).flatMap((feedback) => {
    const authorName =
      feedback.author?.displayName ||
      feedback.author?.username ||
      formatIdentity(feedback.author?.id);

    if (!authorName) {
      return [];
    }

    return [
      {
        id: feedback.id,
        author: {
          name: authorName,
          avatar: feedback.author?.avatarUrl || undefined,
        },
        rating: feedback.rating,
        comment: feedback.content,
        createdAt: formatRelativeDate(feedback.createdAt),
      },
    ];
  });
}

async function fetchProjectPayload(projectId: string): Promise<{
  project: Project | null;
  feedbacks: Feedback[];
}> {
  const res = await fetch(`/api/projects/${projectId}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load project (${res.status})`);
  }

  const data = (await res.json()) as { project?: ApiProject };
  if (!data.project) {
    return { project: null, feedbacks: [] };
  }

  return {
    project: mapProject(data.project),
    feedbacks: mapFeedback(data.project),
  };
}

export default function ProjectDetailPage() {
  const t = useTranslations("common");
  const { id } = useParams();
  const projectId =
    typeof id === "string" ? id : Array.isArray(id) ? id[0] : undefined;
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setFeedbacks([]);
      setIsLoading(false);
      return;
    }
    const resolvedProjectId = projectId;

    async function fetchProject() {
      try {
        const data = await fetchProjectPayload(resolvedProjectId);
        setProject(data.project);
        setFeedbacks(data.feedbacks);
      } catch (error) {
        console.error("Failed to fetch project:", error);
        setProject(null);
        setFeedbacks([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProject();
  }, [projectId]);

  const handleLike = () => {
    if (!project) return;
    void (async () => {
      const wasLiked = isLiked;
      try {
        const res = await fetch(`/api/projects/${project.id}/like`, {
          method: "POST",
        });
        if (!res.ok) {
          throw new Error(`Failed to toggle like (${res.status})`);
        }
        const data = (await res.json()) as { liked?: boolean };
        const liked = Boolean(data.liked);
        setIsLiked(liked);
        setProject((prev) =>
          prev
            ? {
                ...prev,
                likes: Math.max(0, prev.likes + (liked === wasLiked ? 0 : liked ? 1 : -1)),
              }
            : prev
        );
      } catch (error) {
        console.error("Failed to toggle project like:", error);
      }
    })();
  };

  const handleSubmitFeedback = async (feedback: { rating: number; comment: string }) => {
    if (!projectId) {
      throw new Error("Missing project id");
    }

    const res = await fetch(`/api/projects/${project?.id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: feedback.comment,
        rating: feedback.rating,
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to submit feedback (${res.status})`);
    }

    const data = await fetchProjectPayload(projectId);
    setProject(data.project);
    setFeedbacks(data.feedbacks);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container py-8">
        <GlassCard className="py-16 text-center">
          <p className="text-lg text-muted-foreground">Project not found</p>
          <Link href="/projects">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-10">
      {/* Back button */}
      <Link href="/projects">
        <Button variant="ghost" className="mb-6 -ml-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("back")}
        </Button>
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <GlassCard glowColor="purple">
            <div className="p-6 md:p-8">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <LuxuryBadge color="purple">Project Grid</LuxuryBadge>
                <Badge variant="outline" className="border-primary/30 bg-primary/10">
                  Live profile
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {project.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
              <p className="mt-2 text-lg text-muted-foreground">{project.description}</p>
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {project.views} views
                </span>
                <span>•</span>
                <span>Posted {project.createdAt}</span>
              </div>
            </div>
          </GlassCard>

          {/* Gallery */}
          <Card>
            <CardContent className="p-0">
              <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <ExternalLink className="h-24 w-24 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About this Project</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                {project.fullDescription?.split("\n").map((paragraph, i) =>
                  paragraph.trim() ? (
                    <p key={i} className="text-muted-foreground">
                      {paragraph}
                    </p>
                  ) : null
                )}
              </div>
            </CardContent>
          </Card>

          {/* Feedback Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Reviews & Feedback</h2>
            <FeedbackSection
              feedbacks={feedbacks}
              onSubmit={handleSubmitFeedback}
              canSubmit={true}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <GlassCard glowColor="purple">
            <div className="p-6">
              <div className="flex gap-2 mb-4">
                <Button
                  size="lg"
                  variant={isLiked ? "default" : "outline"}
                  className="flex-1"
                  onClick={handleLike}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                  {project.likes}
                </Button>
                <Button size="lg" variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
              <div className="space-y-2">
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button className="w-full" variant="solana">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Demo
                    </Button>
                  </a>
                )}
                {project.repoUrl && (
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button variant="outline" className="w-full">
                      <Github className="h-4 w-4 mr-2" />
                      View Code
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Author */}
          {project.author ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Creator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-medium">
                    {project.author.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{project.author.name}</p>
                    <p className="text-sm text-muted-foreground">Project Creator</p>
                  </div>
                </div>
                {project.author.bio ? (
                  <p className="text-sm text-muted-foreground">{project.author.bio}</p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {/* Badges */}
          {project.badges && project.badges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Earned Badges</CardTitle>
              </CardHeader>
              <CardContent>
                <BadgeDisplay badges={project.badges} />
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Views</span>
                <span className="font-medium">{project.views}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Likes</span>
                <span className="font-medium">{project.likes}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Posted</span>
                <span className="font-medium">{project.createdAt}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
