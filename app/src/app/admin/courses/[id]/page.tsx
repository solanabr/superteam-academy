"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { PlatformLayout } from "@/components/layout";
import { AdminRoute } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { difficultyLabels, trackLabels } from "@/lib/constants";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  BookOpen,
  Clock,
  User,
  Layers,
  FileText,
  EyeOff,
  Eye,
  Trash2,
} from "lucide-react";

interface CourseDetail {
  _id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: number;
  trackId: number;
  trackLevel: number;
  duration: string;
  xpPerLesson: number;
  lessonCount: number;
  status: string;
  creator: string;
  submittedBy: string;
  submittedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  isActive: boolean;
  whatYouLearn: string[];
  instructor: { name: string; avatar: string | null; bio: string | null } | null;
  modules: {
    _key: string;
    title: string;
    description: string;
    lessons: {
      _key: string;
      title: string;
      description: string;
      type: string;
      xp: number;
      duration: string;
    }[];
  }[];
}

const statusColors: Record<string, string> = {
  draft: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
  pending_review: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
};

export default function AdminCourseReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getToken = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  const fetchCourse = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`/api/admin/courses?status=all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const { courses } = await res.json();
        const found = (courses ?? []).find((c: CourseDetail) => c._id === id);
        setCourse(found ?? null);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [id, getToken]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const handleApprove = async () => {
    setActing(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/courses/${id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        toast.success("Course approved and published!");
        router.push("/admin/courses");
      } else {
        const { error } = await res.json();
        toast.error(error ?? "Failed to approve");
      }
    } catch {
      toast.error("Failed to approve");
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setActing(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/courses/${id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (res.ok) {
        toast.success("Course rejected");
        router.push("/admin/courses");
      } else {
        const { error } = await res.json();
        toast.error(error ?? "Failed to reject");
      }
    } catch {
      toast.error("Failed to reject");
    } finally {
      setActing(false);
    }
  };

  const handleToggleHide = async () => {
    if (!course) return;
    const effectivelyActive = course.isActive !== false;
    setActing(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/courses/${id}/hide`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hidden: effectivelyActive }),
      });

      if (res.ok) {
        const action = effectivelyActive ? "hidden" : "visible";
        toast.success(`Course is now ${action}`);
        fetchCourse();
      } else {
        const { error } = await res.json();
        toast.error(error ?? "Failed to update visibility");
      }
    } catch {
      toast.error("Failed to update visibility");
    } finally {
      setActing(false);
    }
  };

  const handleDelete = async () => {
    setActing(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/courses/${id}/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Course permanently deleted");
        router.push("/admin/courses");
      } else {
        const { error } = await res.json();
        toast.error(error ?? "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setActing(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <AdminRoute>
      <PlatformLayout>
        <div className="container mx-auto px-4 py-8 lg:py-12 max-w-4xl">
          {/* Back */}
          <Button asChild variant="ghost" size="sm" className="mb-6">
            <Link href="/admin/courses">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Review Queue
            </Link>
          </Button>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ) : !course ? (
            <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
              <p className="text-lg">Course not found</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Title + Status */}
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
                  <Badge className={statusColors[course.status] ?? ""}>
                    {statusLabels[course.status] ?? course.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-2">{course.description}</p>
              </div>

              {/* Meta */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Difficulty", value: difficultyLabels[course.difficulty] ?? `${course.difficulty}`, icon: Layers },
                  { label: "Track", value: trackLabels[course.trackId] ?? `Track ${course.trackId}`, icon: BookOpen },
                  { label: "Lessons", value: `${course.lessonCount ?? 0}`, icon: FileText },
                  { label: "XP / Lesson", value: `${course.xpPerLesson ?? 0}`, icon: Clock },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <m.icon className="h-3.5 w-3.5" />
                      {m.label}
                    </div>
                    <p className="font-semibold">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Creator info */}
              <div className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <User className="h-3.5 w-3.5" />
                  Creator
                </div>
                <p className="font-mono text-sm">{course.creator}</p>
                {course.instructor && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Instructor: {course.instructor.name}
                    {course.instructor.bio && ` — ${course.instructor.bio}`}
                  </p>
                )}
                {course.submittedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Submitted: {new Date(course.submittedAt).toLocaleString()}
                  </p>
                )}
              </div>

              {/* What you'll learn */}
              {course.whatYouLearn && course.whatYouLearn.length > 0 && (
                <div className="rounded-xl border bg-card p-5">
                  <h3 className="font-semibold mb-3">What You&apos;ll Learn</h3>
                  <ul className="space-y-1.5">
                    {course.whatYouLearn.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Modules & Lessons */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Course Structure</h3>
                {course.modules && course.modules.length > 0 ? (
                  <div className="space-y-4">
                    {course.modules.map((mod, mi) => (
                      <div key={mod._key} className="rounded-xl border bg-card">
                        <div className="p-4 border-b">
                          <h4 className="font-semibold">
                            Module {mi + 1}: {mod.title}
                          </h4>
                          {mod.description && (
                            <p className="text-sm text-muted-foreground mt-0.5">{mod.description}</p>
                          )}
                        </div>
                        {mod.lessons && mod.lessons.length > 0 && (
                          <div className="divide-y">
                            {mod.lessons.map((les, li) => (
                              <div key={les._key} className="px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-mono text-muted-foreground w-6">
                                    {mi + 1}.{li + 1}
                                  </span>
                                  <div>
                                    <p className="text-sm font-medium">{les.title}</p>
                                    {les.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-1">{les.description}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {les.type ?? "content"}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">{les.xp ?? 0} XP</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No modules defined</p>
                )}
              </div>

              {/* Rejection reason (if previously rejected) */}
              {course.status === "rejected" && course.rejectionReason && (
                <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-5">
                  <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">Rejection Reason</h3>
                  <p className="text-sm">{course.rejectionReason}</p>
                  {course.reviewedAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Reviewed: {new Date(course.reviewedAt).toLocaleString()}
                      {course.reviewedBy && ` by ${course.reviewedBy.slice(0, 8)}...`}
                    </p>
                  )}
                </div>
              )}

              {/* Review Actions */}
              {(course.status === "pending_review" || course.status === "draft") && (
                <div className="rounded-xl border bg-card p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Review Actions</h3>

                  {showRejectForm ? (
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Rejection Reason</label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Explain why this course is being rejected..."
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          onClick={handleReject}
                          disabled={acting}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {acting ? "Rejecting..." : "Confirm Rejection"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowRejectForm(false)}
                          disabled={acting}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Button
                        onClick={handleApprove}
                        disabled={acting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {acting ? "Approving..." : "Approve & Publish"}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setShowRejectForm(true)}
                        disabled={acting}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Visibility & Delete */}
              {(() => {
                const effectivelyActive = course.isActive !== false;
                return (
              <div className="rounded-xl border bg-card p-6 space-y-4">
                <h3 className="font-semibold text-lg">Course Management</h3>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    variant="outline"
                    onClick={handleToggleHide}
                    disabled={acting}
                  >
                    {effectivelyActive ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        {acting ? "Hiding..." : "Hide Course"}
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        {acting ? "Showing..." : "Show Course"}
                      </>
                    )}
                  </Button>

                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-destructive font-medium">Are you sure? This is permanent.</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={acting}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {acting ? "Deleting..." : "Yes, Delete"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={acting}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={acting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Course
                    </Button>
                  )}
                </div>
                {!effectivelyActive && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    This course is currently hidden from the public catalog.
                  </p>
                )}
              </div>
                );
              })()}
            </div>
          )}
        </div>
      </PlatformLayout>
    </AdminRoute>
  );
}
