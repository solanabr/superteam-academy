"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CmsCourse } from "@/lib/cms/types";

export default function AdminCoursesPage(): JSX.Element {
  const [courses, setCourses] = useState<CmsCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseSlug, setNewCourseSlug] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      const response = await fetch("/api/admin/courses");
      const json = (await response.json()) as { courses: CmsCourse[] };
      setCourses(json.courses);
      if (json.courses[0]) {
        setSelectedCourseId(json.courses[0]._id);
      }
    };
    void run();
  }, []);

  const selectedCourse = useMemo(
    () => courses.find((course) => course._id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );

  const createCourse = async (): Promise<void> => {
    setError("");
    const response = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: newCourseTitle || "New Course",
        slug: { current: newCourseSlug || "new-course" },
        description: "",
        topic: "General",
        difficulty: "beginner",
        durationHours: 1,
        xpReward: 100
      })
    });

    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not create course.");
      return;
    }

    const refreshed = await fetch("/api/admin/courses");
    const json = (await refreshed.json()) as { courses: CmsCourse[] };
    setCourses(json.courses);
    setNewCourseTitle("");
    setNewCourseSlug("");
  };

  const deleteCourse = async (id: string): Promise<void> => {
    setError("");
    const response = await fetch(`/api/admin/courses?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not delete course.");
      return;
    }

    setCourses((prev) => prev.filter((course) => course._id !== id));
    if (selectedCourseId === id) {
      setSelectedCourseId("");
    }
  };

  const moveLesson = (moduleId: string, lessonIndex: number, direction: -1 | 1): void => {
    setCourses((prev) =>
      prev.map((course) => {
        if (course._id !== selectedCourseId) {
          return course;
        }

        return {
          ...course,
          modules: course.modules.map((module) => {
            if (module._id !== moduleId) {
              return module;
            }

            const nextIndex = lessonIndex + direction;
            if (nextIndex < 0 || nextIndex >= module.lessons.length) {
              return module;
            }

            const lessons = [...module.lessons];
            const current = lessons[lessonIndex];
            lessons[lessonIndex] = lessons[nextIndex];
            lessons[nextIndex] = current;

            return {
              ...module,
              lessons: lessons.map((lesson, index) => ({ ...lesson, order: index + 1 }))
            };
          })
        };
      })
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-bold">Admin Courses</h1>

      <Card>
        <CardHeader>
          <CardTitle>Create Course</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input
            className="h-10 rounded-md border bg-background px-3 text-sm"
            placeholder="Course title"
            value={newCourseTitle}
            onChange={(event) => setNewCourseTitle(event.target.value)}
          />
          <input
            className="h-10 rounded-md border bg-background px-3 text-sm"
            placeholder="course-slug"
            value={newCourseSlug}
            onChange={(event) => setNewCourseSlug(event.target.value)}
          />
          <Button onClick={() => void createCourse()}>Create</Button>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {courses.map((course) => (
              <div key={course._id} className="flex items-center gap-2">
                <button
                  className={`flex-1 rounded-md border px-3 py-2 text-left text-sm ${
                    selectedCourseId === course._id ? "border-primary" : ""
                  }`}
                  onClick={() => setSelectedCourseId(course._id)}
                >
                  {course.title}
                </button>
                <Button size="sm" variant="outline" onClick={() => void deleteCourse(course._id)}>
                  Delete
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lesson Ordering</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedCourse ? (
              <p className="text-sm text-muted-foreground">Select a course to manage modules and lessons.</p>
            ) : (
              selectedCourse.modules.map((module) => (
                <div key={module._id} className="space-y-2 rounded-md border p-3">
                  <h2 className="font-medium">{module.title}</h2>
                  {module.lessons.map((lesson, index) => (
                    <div key={lesson._id} className="flex items-center justify-between rounded-md border p-2">
                      <span className="text-sm">
                        {index + 1}. {lesson.title}
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => moveLesson(module._id, index, -1)}>
                          Up
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => moveLesson(module._id, index, 1)}>
                          Down
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
