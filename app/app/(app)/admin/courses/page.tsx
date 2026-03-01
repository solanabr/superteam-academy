"use client";

import { PageHeader } from "@/components/app";
import {
  useAllCourses,
  useCreateCourse,
  useUpdateCourse,
  useIsAdmin,
  useCredentialCollectionsList,
} from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import Link from "next/link";

type CourseAccount = {
  courseId: string;
  totalEnrollments: number;
  totalCompletions: number;
  isActive: boolean;
  xpPerLesson: number;
  lessonCount: number;
};

export default function AdminCoursesPage() {
  const { role } = useIsAdmin();
  const { data: courses } = useAllCourses();
  const { data: collectionsList } = useCredentialCollectionsList();
  const { mutate: createCourse, isPending: creating } = useCreateCourse();
  const { mutate: updateCourse, isPending: updating } = useUpdateCourse();
  const collectionsData = Array.isArray(collectionsList) ? collectionsList : [];
  const [createForm, setCreateForm] = useState({
    courseId: "",
    lessonCount: 3,
    xpPerLesson: 100,
    trackId: 1,
    trackLevel: 1,
  });
  const [updateForm, setUpdateForm] = useState({
    courseId: "",
    newIsActive: true,
    newXpPerLesson: 100,
  });

  const isAuthority = role === "authority";
  const courseList = (courses ?? []).map((c) => c.account as CourseAccount);

  useEffect(() => {
    if (collectionsData.length > 0 && !collectionsData.some((c) => c.trackId === createForm.trackId)) {
      setCreateForm((f) => ({ ...f, trackId: collectionsData[0].trackId }));
    }
  }, [collectionsData]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Courses"
        subtitle="Create and manage on-chain courses"
      />

      {courseList.length > 0 && (
        <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
          <h2 className="font-game text-xl mb-1">On-chain courses</h2>
          <p className="font-game text-muted-foreground text-sm mb-4">
            Enrollments and completions from chain
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-game">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-2 pr-4 font-game">Course ID</th>
                  <th className="text-right py-2 px-2 font-game">Enrollments</th>
                  <th className="text-right py-2 px-2 font-game">Completions</th>
                  <th className="text-center py-2 px-2 font-game">Active</th>
                  <th className="text-right py-2 px-2 font-game">XP/lesson</th>
                  <th className="text-right py-2 pl-2 font-game">Lessons</th>
                </tr>
              </thead>
              <tbody>
                {courseList.map((acc) => (
                  <tr key={acc.courseId} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-mono">
                      <Link
                        href="/test"
                        className="text-yellow-400 hover:underline"
                      >
                        {acc.courseId}
                      </Link>
                    </td>
                    <td className="text-right py-2 px-2 tabular-nums">
                      {acc.totalEnrollments}
                    </td>
                    <td className="text-right py-2 px-2 tabular-nums">
                      {acc.totalCompletions}
                    </td>
                    <td className="text-center py-2 px-2">
                      {acc.isActive ? "Yes" : "No"}
                    </td>
                    <td className="text-right py-2 px-2 tabular-nums">
                      {acc.xpPerLesson}
                    </td>
                    <td className="text-right py-2 pl-2 tabular-nums">
                      {acc.lessonCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isAuthority && (
        <>
          <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
            <h2 className="font-game text-xl mb-1">Create course</h2>
            <p className="font-game text-muted-foreground text-sm mb-4">
              Register a new course PDA. Create at least one track collection under Credentials first. Requires authority via backend.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <div className="space-y-2 w-full min-w-0 sm:min-w-[160px] sm:max-w-[220px]">
                <Label className="font-game">courseId</Label>
                <Input
                  placeholder="e.g. intro-solana"
                  value={createForm.courseId}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, courseId: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2 w-full min-w-0 sm:w-24">
                <Label className="font-game">lessonCount</Label>
                <Input
                  type="number"
                  min={1}
                  value={createForm.lessonCount}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      lessonCount: +e.target.value || 1,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 w-full min-w-0 sm:w-24">
                <Label className="font-game">xpPerLesson</Label>
                <Input
                  type="number"
                  min={0}
                  value={createForm.xpPerLesson}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      xpPerLesson: +e.target.value || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 w-full min-w-0 sm:min-w-[140px] sm:max-w-[200px]">
                <Label className="font-game">Credential track</Label>
                <Select
                  value={collectionsData.length > 0 ? String(createForm.trackId) : ""}
                  onValueChange={(v) =>
                    setCreateForm((f) => ({ ...f, trackId: +v || 1 }))
                  }
                >
                  <SelectTrigger className="font-game">
                    <SelectValue placeholder="Select track" />
                  </SelectTrigger>
                  <SelectContent>
                    {collectionsData.map((c) => (
                      <SelectItem key={c.trackId} value={String(c.trackId)}>
                        <div className="flex items-center gap-2">
                          {c.imageUrl ? (
                            <img
                              src={c.imageUrl}
                              alt=""
                              className="h-6 w-6 rounded object-cover shrink-0"
                            />
                          ) : null}
                          <span>{c.name ?? `Track ${c.trackId}`}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 w-full min-w-0 sm:w-20">
                <Label className="font-game">trackLevel</Label>
                <Input
                  type="number"
                  min={1}
                  value={createForm.trackLevel}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      trackLevel: Math.max(1, +e.target.value || 1),
                    }))
                  }
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="pixel"
                  className="font-game"
                  disabled={!createForm.courseId || collectionsData.length === 0 || creating}
                  onClick={() =>
                    createCourse({
                      courseId: createForm.courseId,
                      lessonCount: createForm.lessonCount,
                      xpPerLesson: createForm.xpPerLesson,
                      trackId: createForm.trackId,
                      trackLevel: createForm.trackLevel,
                    })
                  }
                >
                  {creating ? "Creating…" : "Create"}
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
            <h2 className="font-game text-xl mb-1">Update course</h2>
            <p className="font-game text-muted-foreground text-sm mb-4">
              Change XP, active status, or other fields.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <div className="space-y-2 w-full min-w-0 sm:min-w-[160px] sm:max-w-[240px]">
                <Label className="font-game">Course</Label>
                <Select
                  value={updateForm.courseId}
                  onValueChange={(v) =>
                    setUpdateForm((f) => ({ ...f, courseId: v }))
                  }
                >
                  <SelectTrigger className="w-full font-game">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseList.map((acc) => (
                      <SelectItem key={acc.courseId} value={acc.courseId}>
                        {acc.courseId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 w-full min-w-0 sm:w-24">
                <Label className="font-game">newXpPerLesson</Label>
                <Input
                  type="number"
                  min={0}
                  value={updateForm.newXpPerLesson}
                  onChange={(e) =>
                    setUpdateForm((f) => ({
                      ...f,
                      newXpPerLesson: +e.target.value || 0,
                    }))
                  }
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="pixel"
                  className="font-game"
                  disabled={!updateForm.courseId || updating}
                  onClick={() =>
                    updateCourse({
                      courseId: updateForm.courseId,
                      newIsActive: updateForm.newIsActive,
                      newXpPerLesson: updateForm.newXpPerLesson,
                    })
                  }
                >
                  {updating ? "Updating…" : "Update"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {!isAuthority && (
        <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
          <p className="font-game text-muted-foreground text-sm">
            Only the authority can create or update courses. Use the backend
            API with authority keypair.
          </p>
        </div>
      )}

      <p className="font-game text-sm text-muted-foreground">
        Full test playground: <Link href="/test" className="text-yellow-400 hover:underline">/test</Link>
      </p>
    </div>
  );
}
