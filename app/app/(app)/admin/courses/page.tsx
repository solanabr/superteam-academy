"use client";

import { PageHeader } from "@/components/app";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useAllCourses,
  useCreateCourse,
  useUpdateCourse,
  useIsAdmin,
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
import { useState } from "react";
import Link from "next/link";

export default function AdminCoursesPage() {
  const { role } = useIsAdmin();
  const { data: courses } = useAllCourses();
  const { mutate: createCourse, isPending: creating } = useCreateCourse();
  const { mutate: updateCourse, isPending: updating } = useUpdateCourse();
  const [createForm, setCreateForm] = useState({
    courseId: "",
    lessonCount: 3,
    xpPerLesson: 100,
  });
  const [updateForm, setUpdateForm] = useState({
    courseId: "",
    newIsActive: true,
    newXpPerLesson: 100,
  });

  const isAuthority = role === "authority";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        subtitle="Create and manage on-chain courses"
      />

      {courses && courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">On-chain courses</CardTitle>
            <CardDescription>Existing course PDAs</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 font-mono text-sm">
              {courses.map((c) => {
                const acc = c.account as { courseId: string };
                return (
                  <li key={acc.courseId}>
                    <Link
                      href="/test"
                      className="text-primary hover:underline"
                    >
                      {acc.courseId}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {isAuthority && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create course</CardTitle>
              <CardDescription>
                Register a new course PDA. Requires authority via backend.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2 min-w-[180px]">
                  <Label>courseId</Label>
                  <Input
                    placeholder="e.g. intro-solana"
                    value={createForm.courseId}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, courseId: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 w-24">
                  <Label>lessonCount</Label>
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
                <div className="space-y-2 w-24">
                  <Label>xpPerLesson</Label>
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
                <div className="flex items-end">
                  <Button
                    disabled={!createForm.courseId || creating}
                    onClick={() =>
                      createCourse({
                        courseId: createForm.courseId,
                        lessonCount: createForm.lessonCount,
                        xpPerLesson: createForm.xpPerLesson,
                      })
                    }
                  >
                    {creating ? "Creating…" : "Create"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Update course</CardTitle>
              <CardDescription>
                Change XP, active status, or other fields.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2 min-w-[200px]">
                  <Label>Course</Label>
                  <Select
                    value={updateForm.courseId}
                    onValueChange={(v) =>
                      setUpdateForm((f) => ({ ...f, courseId: v }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {(courses ?? []).map((c) => {
                        const acc = c.account as { courseId: string };
                        return (
                          <SelectItem
                            key={acc.courseId}
                            value={acc.courseId}
                          >
                            {acc.courseId}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 w-24">
                  <Label>newXpPerLesson</Label>
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
            </CardContent>
          </Card>
        </>
      )}

      {!isAuthority && (
        <Card>
          <CardContent className="py-6">
            <p className="text-muted-foreground text-sm">
              Only the authority can create or update courses. Use the backend
              API with authority keypair.
            </p>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Full test playground: <Link href="/test" className="text-primary hover:underline">/test</Link>
      </p>
    </div>
  );
}
