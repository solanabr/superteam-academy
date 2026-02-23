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
import { Search, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  fetchStats,
  createCourse,
  updateCourse,
  type AdminStats,
} from "@/lib/admin/api";
import { TxResult } from "../shared/tx-result";
import { TRACKS } from "@/lib/solana/constants";

type OnChainCourse = AdminStats["courses"][number];

function CourseEditDialog({
  course,
  adminSecret,
}: {
  course: OnChainCourse;
  adminSecret: string;
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
      toast.success(`Course "${course.courseId}" updated`);
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
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
          {lastTx && <TxResult signature={lastTx} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateCourseDialog({ adminSecret }: { adminSecret: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [lessonCount, setLessonCount] = useState("5");
  const [difficulty, setDifficulty] = useState("1");
  const [xpPerLesson, setXpPerLesson] = useState("100");
  const [trackId, setTrackId] = useState("0");
  const [trackLevel, setTrackLevel] = useState("1");
  const [creatorRewardXp, setCreatorRewardXp] = useState("0");
  const [minCompletions, setMinCompletions] = useState("0");
  const [creator, setCreator] = useState("");
  const [lastTx, setLastTx] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createCourse(adminSecret, {
        courseId,
        creator: creator || undefined,
        lessonCount: Number(lessonCount),
        difficulty: Number(difficulty),
        xpPerLesson: Number(xpPerLesson),
        trackId: Number(trackId),
        trackLevel: Number(trackLevel),
        creatorRewardXp: Number(creatorRewardXp),
        minCompletionsForReward: Number(minCompletions),
      }),
    onSuccess: (res) => {
      setLastTx(res.txSignature);
      toast.success(`Course "${courseId}" created on-chain`);
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const reset = () => {
    setCourseId("");
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Course ID</label>
            <Input
              placeholder="e.g. intro-to-solana"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            />
          </div>
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
          <div className="grid grid-cols-2 gap-3">
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
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              Min Completions for Reward
            </label>
            <Input
              type="number"
              min={0}
              value={minCompletions}
              onChange={(e) => setMinCompletions(e.target.value)}
            />
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
            {mutation.isPending ? "Creating..." : "Create Course On-Chain"}
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
  modules: {
    id: string;
    title: string;
    lessons: { id: string; title: string; type: string }[];
  }[];
}

export function CoursesTab({ adminSecret }: { adminSecret: string }) {
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
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {course.enrollments} enrolled · {course.completions}{" "}
                      completed · {course.xpPerLesson} XP/lesson ·{" "}
                      {course.lessonCount} lessons
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="mb-3 flex justify-end">
                  <CourseEditDialog course={course} adminSecret={adminSecret} />
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
