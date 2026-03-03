"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

type Course = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  instructor?: string;
  duration?: string;
  difficulty?: string;
  track?: string;
  published: boolean;
  _createdAt: string;
  _updatedAt: string;
};

export default function TeachCoursesPage() {
  const router = useRouter();
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const t = useTranslations("teach");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const linkedAddress =
    user?.wallet?.address ?? user?.linkedAccounts?.find((a) => a.type === "wallet")?.address;
  const walletAddress =
    linkedAddress ??
    wallets?.[0]?.address ??
    (typeof window !== "undefined" &&
      localStorage.getItem("linkedWalletAddress"));

  useEffect(() => {
    if (!authenticated || !walletAddress) {
      setLoading(false);
      return;
    }

    fetch(`/api/courses/my-courses?wallet=${encodeURIComponent(walletAddress)}&t=${Date.now()}`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setCourses(data.courses || []);
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load courses");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authenticated, walletAddress]);

  const handlePublish = async (courseId: string, currentPublished: boolean) => {
    if (!walletAddress) return;

    setPublishingId(courseId);
    const endpoint = currentPublished ? "unpublish" : "publish";
    try {
      const res = await fetch(`/api/courses/${courseId}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddress }),
      });

      if (res.ok) {
        setCourses((prev) =>
          prev.map((c) =>
            c._id === courseId ? { ...c, published: !currentPublished } : c
          )
        );
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update publish status");
      }
    } catch (err) {
      alert("Failed to update publish status");
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!walletAddress) return;
    if (!confirm("Are you sure you want to delete this course?")) return;

    const res = await fetch(
      `/api/courses/${courseId}?wallet=${encodeURIComponent(walletAddress)}`,
      { method: "DELETE" }
    );

    if (res.ok) {
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete course");
    }
  };

  if (!authenticated) {
    return (
      <div className="container py-8">
        <p>{t("login_view_courses")}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-8">
        <p>{t("loading_courses")}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-void pt-4 pb-12">
      <div className="mx-auto max-w-6xl px-4">
        <nav className="flex items-center gap-2 text-xs font-mono text-text-muted mb-6 uppercase tracking-widest">
          <Link href="/dashboard" className="hover:text-solana transition-colors">Dashboard</Link>
          <span className="text-white/20">/</span>
          <span className="text-solana">{t("studio")}</span>
        </nav>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Courses</h1>
          <Button onClick={() => router.push("/teach/courses/create")} variant="solana-ghost">
            Create Course
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-500">
            {error}
          </div>
        )}

        {courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary mb-4">No courses yet.</p>
            <Button onClick={() => router.push("/teach/courses/create")} variant="solana-ghost">
              Create your first course
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course._id}
                className="rounded-xl border border-border-subtle bg-surface p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-text-primary">{course.title}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded ${course.published
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-500/20 text-gray-400"
                      }`}
                  >
                    {course.published ? "Published" : "Draft"}
                  </span>
                </div>

                {course.description && (
                  <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                    {course.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {course.difficulty && (
                    <span className="text-xs px-2 py-1 bg-surface-high rounded">
                      {course.difficulty}
                    </span>
                  )}
                  {course.track && (
                    <span className="text-xs px-2 py-1 bg-surface-high rounded">
                      {course.track}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link href={`/teach/courses/${course._id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePublish(course._id, course.published)}
                    disabled={publishingId === course._id}
                  >
                    {publishingId === course._id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {course.published ? "Unpublishing..." : "Publishing..."}
                      </>
                    ) : (
                      course.published ? "Unpublish" : "Publish"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(course._id)}
                    className="text-red-400 hover:text-red-300 border-red-500/20 hover:border-red-500/50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
