"use client";

import { useState, useEffect, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { PlatformLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { difficultyLabels } from "@/lib/constants";
import {
  Plus,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  FileEdit,
  ArrowRight,
  Pencil,
} from "lucide-react";

interface MyCourse {
  _id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: number;
  trackId: number;
  lessonCount: number;
  status: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  isActive: boolean;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: "Draft", color: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400", icon: FileEdit },
  pending_review: { label: "Pending Review", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: Clock },
  approved: { label: "Live", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-600 dark:text-red-400", icon: XCircle },
};

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<MyCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/courses/my", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const { courses: data } = await res.json();
        setCourses(data ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return (
    <ProtectedRoute requireWallet>
      <PlatformLayout>
        <div className="container mx-auto px-4 py-8 lg:py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
              <p className="text-muted-foreground mt-1">Courses you&apos;ve created</p>
            </div>
            <Button asChild>
              <Link href="/create-course">
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Link>
            </Button>
          </div>

          {/* Course list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <h2 className="text-lg font-semibold mb-2">No courses yet</h2>
              <p className="text-muted-foreground mb-6">
                Create your first course and share your Solana knowledge
              </p>
              <Button asChild>
                <Link href="/create-course">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => {
                const cfg = statusConfig[course.status] ?? statusConfig.draft;
                const Icon = cfg.icon;
                return (
                  <div
                    key={course._id}
                    className="rounded-xl border bg-card p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <h3 className="font-semibold truncate">{course.title}</h3>
                          <Badge className={cfg.color}>{cfg.label}</Badge>
                          {course.difficulty && (
                            <Badge variant="outline" className="text-xs">
                              {difficultyLabels[course.difficulty]}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {course.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{course.lessonCount ?? 0} lessons</span>
                          {course.submittedAt && (
                            <span>Submitted {new Date(course.submittedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/edit-course/${course._id}`}>
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        {course.status === "approved" && course.slug && (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/courses/${course.slug}`}>
                              View
                              <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Rejection feedback */}
                    {course.status === "rejected" && course.rejectionReason && (
                      <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3">
                        <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">
                          Feedback from reviewer
                        </p>
                        <p className="text-sm">{course.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PlatformLayout>
    </ProtectedRoute>
  );
}
