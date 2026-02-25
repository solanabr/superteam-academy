"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { PlatformLayout } from "@/components/layout";
import { AdminRoute } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { difficultyLabels, trackLabels } from "@/lib/constants";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  Layers,
  EyeOff,
  Eye,
  Trash2,
  Search,
} from "lucide-react";

interface CourseSummary {
  _id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: number;
  trackId: number;
  lessonCount: number;
  status: string;
  isActive: boolean;
  submittedAt: string | null;
  creator: string;
  thumbnailUrl: string | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
  pending_review: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
  hidden: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  hidden: "Hidden",
};

const statusIcons: Record<string, typeof Clock> = {
  draft: Layers,
  pending_review: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  hidden: EyeOff,
};

function getEffectiveStatus(course: CourseSummary): string {
  if (course.isActive === false) return "hidden";
  return course.status ?? "approved";
}

const tabs = [
  { value: "all", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "hidden", label: "Hidden" },
  { value: "pending_review", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "draft", label: "Draft" },
];

export default function AdminCoursesPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") ?? "all";
  const [activeTab, setActiveTab] = useState(initialStatus);
  const [allCourses, setAllCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const getToken = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      // Always fetch all courses and filter client-side
      const res = await fetch("/api/admin/courses?status=all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const { courses: data } = await res.json();
        setAllCourses(data ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Client-side filtering by tab and search
  const filteredCourses = useMemo(() => {
    let result = allCourses;

    // Filter by status tab
    if (activeTab !== "all") {
      result = result.filter((c) => getEffectiveStatus(c) === activeTab);
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.creator?.toLowerCase().includes(q) ||
          c.slug?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [allCourses, activeTab, searchQuery]);

  // Count per tab
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allCourses.length };
    for (const course of allCourses) {
      const s = getEffectiveStatus(course);
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [allCourses]);

  const handleToggleHide = async (e: React.MouseEvent, courseId: string, isCurrentlyActive: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setActingOn(courseId);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/courses/${courseId}/hide`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: isCurrentlyActive }),
      });
      if (res.ok) {
        toast.success(isCurrentlyActive ? "Course hidden" : "Course is now visible");
        fetchCourses();
      } else {
        const { error } = await res.json();
        toast.error(error ?? "Failed to update visibility");
      }
    } catch {
      toast.error("Failed to update visibility");
    } finally {
      setActingOn(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, courseId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActingOn(courseId);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/courses/${courseId}/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Course deleted permanently");
        fetchCourses();
      } else {
        const { error } = await res.json();
        toast.error(error ?? "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setActingOn(null);
      setDeleteConfirmId(null);
    }
  };

  return (
    <AdminRoute>
      <PlatformLayout>
        <div className="container mx-auto px-4 py-8 lg:py-12">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Admin
              </Link>
            </Button>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
            <p className="text-muted-foreground mt-1">Review, hide, and manage all courses</p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {tabs.map((tab) => (
              <Button
                key={tab.value}
                variant={activeTab === tab.value ? "default" : "outline"}
                size="sm"
                className="h-9"
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
                {!loading && (tabCounts[tab.value] ?? 0) > 0 && (
                  <Badge
                    variant="outline"
                    className="ml-1.5 h-5 px-1.5 text-[10px] border-current/20"
                  >
                    {tabCounts[tab.value]}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Course list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No courses found</p>
              <p className="text-sm">
                {searchQuery
                  ? `No courses matching "${searchQuery}"`
                  : `No courses with status "${statusLabels[activeTab] ?? activeTab}"`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCourses.map((course) => {
                const effectivelyActive = course.isActive !== false;
                const displayStatus = getEffectiveStatus(course);
                const Icon = statusIcons[displayStatus] ?? Clock;
                const isActing = actingOn === course._id;
                return (
                  <div
                    key={course._id}
                    className="rounded-xl border bg-card p-5 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Link
                        href={`/admin/courses/${course._id}`}
                        className="flex-1 min-w-0 space-y-1.5"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <h3 className="font-semibold truncate">{course.title}</h3>
                          <Badge className={statusColors[displayStatus] ?? ""}>
                            {statusLabels[displayStatus] ?? course.status ?? "Active"}
                          </Badge>
                          {course.difficulty && (
                            <Badge variant="outline" className="text-xs">
                              {difficultyLabels[course.difficulty] ?? `Level ${course.difficulty}`}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {course.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>By {course.creator?.slice(0, 8)}...</span>
                          {course.trackId && <span>{trackLabels[course.trackId] ?? `Track ${course.trackId}`}</span>}
                          <span>{course.lessonCount ?? 0} lessons</span>
                          {course.submittedAt && (
                            <span>Submitted {new Date(course.submittedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </Link>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={isActing}
                          title={effectivelyActive ? "Hide course" : "Show course"}
                          onClick={(e) => handleToggleHide(e, course._id, effectivelyActive)}
                        >
                          {effectivelyActive ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>

                        {deleteConfirmId === course._id ? (
                          <div className="flex items-center gap-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8 text-xs"
                              disabled={isActing}
                              onClick={(e) => handleDelete(e, course._id)}
                            >
                              {isActing ? "..." : "Confirm"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              disabled={isActing}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteConfirmId(null); }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={isActing}
                            title="Delete course"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteConfirmId(course._id); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}

                        <Link href={`/admin/courses/${course._id}`}>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PlatformLayout>
    </AdminRoute>
  );
}
