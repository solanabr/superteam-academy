"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import type { AdminCourseListItem } from "@/types/admin";

export function CourseList() {
  const t = useTranslations("admin");
  const { walletAddress } = useAdmin();
  const { toast } = useToast();
  const [courses, setCourses] = useState<AdminCourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const headers = { "X-Wallet-Address": walletAddress ?? "" };

  const fetchCourses = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const res = await fetch("/api/admin/courses", {
        headers: { "X-Wallet-Address": walletAddress },
      });
      if (res.ok) setCourses(await res.json());
    } catch (err) {
      console.error("[CourseList]", err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const togglePublish = async (id: string, current: boolean) => {
    const res = await fetch(`/api/admin/courses/${id}/publish`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ published: !current }),
    });
    if (res.ok) {
      setCourses((prev) =>
        prev.map((c) => (c._id === id ? { ...c, published: !current } : c)),
      );
    }
  };

  const deleteCourse = async (id: string) => {
    const res = await fetch(`/api/admin/courses/${id}`, {
      method: "DELETE",
      headers,
    });
    if (res.ok) {
      setCourses((prev) => prev.filter((c) => c._id !== id));
      toast({ title: t("deleteSuccess") });
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--brand-logo-green))] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button asChild className="gap-2">
          <Link href="/admin/courses/new">
            <Plus className="h-4 w-4" />
            {t("createCourse")}
          </Link>
        </Button>
      </div>

      {courses.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          {t("noCourses")}
        </p>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <Card
              key={course._id}
              className="border-[hsl(var(--brand-logo-green))]/30"
            >
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-4 min-w-0">
                  {course.thumbnailUrl && (
                    <img
                      src={course.thumbnailUrl}
                      alt=""
                      className="h-12 w-20 shrink-0 rounded border object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {course.title?.pt || course.slug}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground capitalize">
                        {course.difficulty}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {course.modulesCount} {t("modules").toLowerCase()}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          course.published
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {course.published ? t("published") : t("draft")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePublish(course._id, course.published)}
                    title={t("publishToggle")}
                  >
                    {course.published ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/courses/${course._id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  {deleteId === course._id ? (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteCourse(course._id)}
                      >
                        {t("confirm")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(null)}
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(course._id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
