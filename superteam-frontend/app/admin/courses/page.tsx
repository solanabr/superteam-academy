"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2, BookOpen, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Course } from "@/lib/course-catalog";
import { toast } from "sonner";

const difficultyColors: Record<string, string> = {
  Beginner: "bg-green-500/10 text-green-500",
  Intermediate: "bg-yellow-500/10 text-yellow-500",
  Advanced: "bg-red-500/10 text-red-500",
};

export default function AdminCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);

  const fetchCourses = useCallback(() => {
    fetch("/api/admin/courses")
      .then((r) => r.json())
      .then((d: Course[]) => setCourses(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
  );

  async function handleDelete() {
    if (!deleteSlug) return;
    const res = await fetch(`/api/admin/courses/${deleteSlug}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    setDeleteSlug(null);
    if (data.deactivated) {
      toast.success(`Course "${deleteSlug}" deleted and deactivated on-chain`);
    } else if (data.ok) {
      toast.success(`Course "${deleteSlug}" deleted locally`);
      if (data.chainError)
        toast.warning(`On-chain deactivation failed: ${data.chainError}`);
    } else {
      toast.error(data.error || "Delete failed");
    }
    fetchCourses();
  }

  async function handleCreate(course: Partial<Course>) {
    const res = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: course.slug,
        title: course.title,
        description: course.description || "",
        instructor: course.instructor || "",
        instructorAvatar: (course.instructor || "??").slice(0, 2).toUpperCase(),
        difficulty: course.difficulty || "Beginner",
        duration: course.duration || "0h",
        lessons: 0,
        modules: [],
        rating: 0,
        enrolled: 0,
        tags: [],
        progress: 0,
        xp: Number(course.xp) || 0,
        thumbnail: "/solana.jpg",
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.onChain) {
      toast.success(`Course "${course.title}" created and registered on-chain`);
    } else {
      toast.success(`Course "${course.title}" created locally`);
      if (data.chainError)
        toast.warning(`On-chain registration failed: ${data.chainError}`);
    }
    setCreateOpen(false);
    fetchCourses();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Course Management</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Course
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="secondary">{filtered.length} courses</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead className="text-right">Lessons</TableHead>
                  <TableHead className="text-right">XP</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((course) => (
                  <TableRow key={course.slug}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/courses/${course.slug}`}
                            className="font-medium hover:underline"
                          >
                            {course.title}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">
                            {course.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={difficultyColors[course.difficulty]}
                      >
                        {course.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {course.modules.reduce(
                        (sum, m) => sum + m.lessons.length,
                        0,
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {course.xp.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            router.push(`/admin/courses/${course.slug}`)
                          }
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteSlug(course.slug)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No courses found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <CreateCourseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
      />

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteSlug}
        onOpenChange={(open) => !open && setDeleteSlug(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteSlug}</strong>? This
            cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSlug(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateCourseDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (course: Partial<Course>) => void;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [instructor, setInstructor] = useState("");
  const [difficulty, setDifficulty] =
    useState<Course["difficulty"]>("Beginner");
  const [duration, setDuration] = useState("");
  const [xp, setXp] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onCreate({
      title,
      slug,
      description,
      instructor,
      difficulty,
      duration,
      xp: Number(xp),
    });
    setTitle("");
    setSlug("");
    setDescription("");
    setInstructor("");
    setDifficulty("Beginner");
    setDuration("");
    setXp("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, ""),
                  );
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Instructor</Label>
              <Input
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as Course["difficulty"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>XP</Label>
              <Input
                type="number"
                value={xp}
                onChange={(e) => setXp(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Duration</Label>
            <Input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 12h 30m"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title || !slug}>
              Create Course
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
