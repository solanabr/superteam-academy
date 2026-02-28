"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Pencil, Plus, ExternalLink, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  fetchStats,
  createCourse,
  updateCourse,
  uploadToArweave,
  bulkUploadToArweave,
  type AdminStats,
} from "@/lib/admin/api";
import { TxResult } from "../shared/tx-result";
import { TRACKS } from "@/lib/solana/constants";

type OnChainCourse = AdminStats["courses"][number];

function CourseEditDialog({
  course,
  adminSecret,
  courseContent,
}: {
  course: OnChainCourse;
  adminSecret: string;
  courseContent?: CourseContent;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isActive, setIsActive] = useState(course.isActive);
  const [xpPerLesson, setXpPerLesson] = useState(String(course.xpPerLesson));
  const [creatorRewardXp, setCreatorRewardXp] = useState(
    String(course.creatorRewardXp),
  );
  const [minCompletions, setMinCompletions] = useState(
    String(course.minCompletionsForReward),
  );
  const [lastTx, setLastTx] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      updateCourse(adminSecret, {
        courseId: course.courseId,
        newIsActive: isActive,
        newXpPerLesson: Number(xpPerLesson),
        newCreatorRewardXp: Number(creatorRewardXp),
        newMinCompletionsForReward: Number(minCompletions),
      }),
    onSuccess: (res) => {
      setLastTx(res.txSignature);
      if (res.onChainError) {
        toast.warning(
          `Course "${course.courseId}" DB updated, on-chain failed: ${res.onChainError}`,
        );
      } else {
        toast.success(`Course "${course.courseId}" updated`);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const arweaveUpload = useMutation({
    mutationFn: () =>
      uploadToArweave(adminSecret, {
        type: "course-content",
        data: courseContent,
      }),
    onSuccess: (res) => {
      toast.success(`Uploaded to Arweave: ${res.txId}`);
      queryClient.invalidateQueries({ queryKey: ["course-contents"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {course.courseId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Active</span>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              XP per Lesson
            </label>
            <Input
              type="number"
              value={xpPerLesson}
              onChange={(e) => setXpPerLesson(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              Creator Reward XP
            </label>
            <Input
              type="number"
              value={creatorRewardXp}
              onChange={(e) => setCreatorRewardXp(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              Min Completions for Reward
            </label>
            <Input
              type="number"
              value={minCompletions}
              onChange={(e) => setMinCompletions(e.target.value)}
            />
          </div>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full"
          >
            {mutation.isPending ? "Updating..." : "Update Course"}
          </Button>
          {courseContent && !course.contentTxId && (
            <Button
              variant="outline"
              onClick={() => arweaveUpload.mutate()}
              disabled={arweaveUpload.isPending}
              className="w-full"
            >
              {arweaveUpload.isPending
                ? "Uploading..."
                : "Upload Content to Arweave"}
            </Button>
          )}
          <div className="space-y-1 rounded border p-2 text-xs text-muted-foreground">
            <p>
              <span className="font-medium">On-chain PDA:</span>{" "}
              <span className="font-mono">{course.publicKey}</span>
            </p>
            {course.contentTxId && (
              <p>
                <span className="font-medium">Arweave:</span>{" "}
                <a
                  href={`https://arweave.net/${course.contentTxId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  {course.contentTxId}
                </a>
              </p>
            )}
          </div>
          {lastTx && <TxResult signature={lastTx} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateCourseDialog({ adminSecret }: { adminSecret: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  // Content fields
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [modulesJson, setModulesJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  // On-chain fields
  const [lessonCount, setLessonCount] = useState("5");
  const [difficulty, setDifficulty] = useState("1");
  const [xpPerLesson, setXpPerLesson] = useState("100");
  const [trackId, setTrackId] = useState("0");
  const [trackLevel, setTrackLevel] = useState("1");
  const [creatorRewardXp, setCreatorRewardXp] = useState("0");
  const [minCompletions, setMinCompletions] = useState("0");
  const [creator, setCreator] = useState("");
  const [lastTx, setLastTx] = useState<string | null>(null);

  const parseModules = (): unknown[] | null => {
    if (!modulesJson.trim()) return [];
    try {
      const parsed = JSON.parse(modulesJson);
      if (!Array.isArray(parsed)) {
        setJsonError("Modules must be a JSON array");
        return null;
      }
      setJsonError(null);
      return parsed;
    } catch (e: any) {
      setJsonError(e.message);
      return null;
    }
  };

  const mutation = useMutation({
    mutationFn: () => {
      const modules = parseModules();
      if (modules === null) throw new Error("Invalid modules JSON");
      return createCourse(adminSecret, {
        courseId,
        creator: creator || undefined,
        lessonCount: Number(lessonCount),
        difficulty: Number(difficulty),
        xpPerLesson: Number(xpPerLesson),
        trackId: Number(trackId),
        trackLevel: Number(trackLevel),
        creatorRewardXp: Number(creatorRewardXp),
        minCompletionsForReward: Number(minCompletions),
        title: title || undefined,
        slug: courseId,
        description: description || undefined,
        duration: duration || undefined,
        thumbnail: thumbnail || undefined,
        modules: modules.length > 0 ? modules : undefined,
      });
    },
    onSuccess: (res) => {
      setLastTx(res.txSignature);
      if (res.onChainError) {
        toast.warning(
          `Course "${courseId}" saved to DB but on-chain failed: ${res.onChainError}`,
        );
      } else {
        toast.success(`Course "${courseId}" created`);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["course-contents"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const reset = () => {
    setCourseId("");
    setTitle("");
    setDescription("");
    setDuration("");
    setThumbnail("");
    setModulesJson("");
    setJsonError(null);
    setLessonCount("5");
    setDifficulty("1");
    setXpPerLesson("100");
    setTrackId("0");
    setTrackLevel("1");
    setCreatorRewardXp("0");
    setMinCompletions("0");
    setCreator("");
    setLastTx(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Course
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Course Content
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground">
                Course ID
              </label>
              <Input
                placeholder="e.g. intro-to-solana"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Title</label>
              <Input
                placeholder="e.g. Introduction to Solana"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              Description
            </label>
            <textarea
              placeholder="Course description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground">Duration</label>
              <Input
                placeholder="e.g. 6 hours"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                Thumbnail URL
              </label>
              <Input
                placeholder="/courses/my-course.png"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              Modules (JSON array — paste full course structure)
            </label>
            <textarea
              placeholder={`[
  {
    "id": "m1",
    "title": "Module 1",
    "description": "First module",
    "order": 0,
    "lessons": [
      {
        "id": "l1",
        "title": "Lesson 1",
        "description": "First lesson",
        "order": 0,
        "type": "content",
        "xpReward": 25,
        "duration": "15 min",
        "content": "# Lesson content in Markdown"
      }
    ]
  }
]`}
              value={modulesJson}
              onChange={(e) => {
                setModulesJson(e.target.value);
                setJsonError(null);
              }}
              rows={8}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {jsonError && (
              <p className="mt-1 text-xs text-red-500">
                JSON error: {jsonError}
              </p>
            )}
          </div>

          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2">
            On-chain Parameters
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground">
                Lesson Count
              </label>
              <Input
                type="number"
                min={1}
                value={lessonCount}
                onChange={(e) => setLessonCount(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Auto-calculated from modules if provided
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                Difficulty
              </label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Beginner</SelectItem>
                  <SelectItem value="2">Intermediate</SelectItem>
                  <SelectItem value="3">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground">
                XP per Lesson
              </label>
              <Input
                type="number"
                min={0}
                value={xpPerLesson}
                onChange={(e) => setXpPerLesson(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Track</label>
              <Select value={trackId} onValueChange={setTrackId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRACKS).map(([id, t]) => (
                    <SelectItem key={id} value={id}>
                      {t.display}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-muted-foreground">
                Track Level
              </label>
              <Input
                type="number"
                min={1}
                value={trackLevel}
                onChange={(e) => setTrackLevel(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                Creator Reward XP
              </label>
              <Input
                type="number"
                min={0}
                value={creatorRewardXp}
                onChange={(e) => setCreatorRewardXp(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                Min Completions
              </label>
              <Input
                type="number"
                min={0}
                value={minCompletions}
                onChange={(e) => setMinCompletions(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              Creator Wallet (optional)
            </label>
            <Input
              placeholder="Leave empty for backend signer"
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !courseId}
            className="w-full"
          >
            {mutation.isPending ? "Creating..." : "Create Course"}
          </Button>
          {lastTx && <TxResult signature={lastTx} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CourseContent {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  contentTxId?: string;
  modules: {
    id: string;
    title: string;
    lessons: { id: string; title: string; type: string }[];
  }[];
}

export function CoursesTab({ adminSecret }: { adminSecret: string }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchStats(adminSecret),
  });
  const { data: courseContents } = useQuery<CourseContent[]>({
    queryKey: ["course-contents"],
    queryFn: async () => {
      const res = await fetch("/api/learning/courses");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const bulkUpload = useMutation({
    mutationFn: () => bulkUploadToArweave(adminSecret),
    onSuccess: (res) => {
      toast.success(
        `Arweave bulk upload: ${res.uploaded} uploaded, ${res.skipped} skipped, ${res.failed} failed`,
      );
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["course-contents"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const courses = data?.courses ?? [];
  const filtered = courses.filter((c) =>
    c.courseId.toLowerCase().includes(search.toLowerCase()),
  );
  const missingArweave = courses.filter((c) => !c.contentTxId).length;

  return (
    <div className="space-y-4">
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
        {missingArweave > 0 && (
          <Button
            variant="outline"
            onClick={() => bulkUpload.mutate()}
            disabled={bulkUpload.isPending}
          >
            <Upload className="mr-2 h-4 w-4" />
            {bulkUpload.isPending
              ? "Uploading..."
              : `Push All to Arweave (${missingArweave})`}
          </Button>
        )}
        <CreateCourseDialog adminSecret={adminSecret} />
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          No courses found
        </p>
      )}

      <Accordion type="multiple" className="space-y-2">
        {filtered.map((course) => {
          const dbCourse = courseContents?.find(
            (s) => s.id === course.courseId,
          );
          const track = TRACKS[course.trackId];
          return (
            <AccordionItem
              key={course.courseId}
              value={course.courseId}
              className="rounded-lg border"
            >
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex flex-1 items-center gap-3 text-left">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {dbCourse?.title ?? course.courseId}
                      </span>
                      <Badge
                        variant={course.isActive ? "default" : "secondary"}
                      >
                        {course.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {track && (
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: track.color,
                            color: track.color,
                          }}
                        >
                          {track.display}
                        </Badge>
                      )}
                      {(course.contentTxId || dbCourse?.contentTxId) && (
                        <a
                          href={`https://arweave.net/${course.contentTxId ?? dbCourse?.contentTxId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Badge
                            variant="outline"
                            className="gap-1 border-blue-500 text-blue-500"
                          >
                            Arweave
                            <ExternalLink className="h-2.5 w-2.5" />
                          </Badge>
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {course.enrollments} enrolled · {course.completions}{" "}
                      completed · {course.xpPerLesson} XP/lesson ·{" "}
                      {course.lessonCount} lessons
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground/60">
                      PDA: {course.publicKey}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="mb-3 flex justify-end">
                  <CourseEditDialog
                    course={course}
                    adminSecret={adminSecret}
                    courseContent={dbCourse}
                  />
                </div>
                <div className="mb-3 space-y-1 rounded border bg-muted/30 p-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-muted-foreground">
                      On-chain:
                    </span>
                    <span className="font-mono">{course.publicKey}</span>
                  </div>
                  {(course.contentTxId || dbCourse?.contentTxId) && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">
                        Arweave:
                      </span>
                      <a
                        href={`https://arweave.net/${course.contentTxId ?? dbCourse?.contentTxId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-blue-500 underline"
                      >
                        {course.contentTxId ?? dbCourse?.contentTxId}
                      </a>
                    </div>
                  )}
                  {course.creator && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">
                        Creator:
                      </span>
                      <span className="font-mono">{course.creator}</span>
                    </div>
                  )}
                </div>
                {dbCourse ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {dbCourse.description}
                    </p>
                    <div className="grid gap-2 text-xs sm:grid-cols-3">
                      <div>
                        Difficulty:{" "}
                        <Badge variant="outline">{dbCourse.difficulty}</Badge>
                      </div>
                      <div>Duration: {dbCourse.duration}</div>
                      <div>
                        Creator Reward: {course.creatorRewardXp} XP (min{" "}
                        {course.minCompletionsForReward} completions)
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Modules</h4>
                      {dbCourse.modules.map((mod) => (
                        <Card key={mod.id}>
                          <CardHeader className="py-2 px-3">
                            <CardTitle className="text-sm">
                              {mod.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="px-3 pb-2">
                            <ul className="space-y-1">
                              {mod.lessons.map((lesson) => (
                                <li
                                  key={lesson.id}
                                  className="flex items-center gap-2 text-xs text-muted-foreground"
                                >
                                  <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                  >
                                    {lesson.type}
                                  </Badge>
                                  {lesson.title}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No local content data for this course
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
