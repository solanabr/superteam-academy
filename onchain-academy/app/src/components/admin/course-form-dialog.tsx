"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TRACK_TYPES, TRACK_LABELS, DIFFICULTY_LEVELS } from "@/lib/constants";
import { useAdmin } from "@/lib/hooks/use-admin";
import type { AdminCourse } from "@/app/api/admin/courses/route";

interface CourseFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  course?: AdminCourse | null;
}

interface FormData {
  courseId: string;
  title: string;
  description: string;
  track: string;
  difficulty: string;
  lessonCount: string;
  xpPerLesson: string;
  creatorRewardXp: string;
}

const INITIAL_FORM: FormData = {
  courseId: "",
  title: "",
  description: "",
  track: "rust",
  difficulty: "beginner",
  lessonCount: "1",
  xpPerLesson: "100",
  creatorRewardXp: "0",
};

export function CourseFormDialog({
  open,
  onClose,
  onSuccess,
  course,
}: CourseFormDialogProps) {
  const { walletAddress } = useAdmin();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!course;

  useEffect(() => {
    if (course) {
      setForm({
        courseId: course.courseId,
        title: course.title,
        description: course.description,
        track: course.track,
        difficulty:
          DIFFICULTY_LEVELS[course.difficulty] ?? "beginner",
        lessonCount: String(course.lessonCount),
        xpPerLesson: String(course.xpPerLesson),
        creatorRewardXp: String(course.creatorRewardXp),
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setError(null);
  }, [course, open]);

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): string | null => {
    if (!form.courseId.trim()) return "Course ID is required";
    if (form.courseId.length > 32) return "Course ID max 32 characters";
    const lessons = parseInt(form.lessonCount, 10);
    if (isNaN(lessons) || lessons < 1 || lessons > 255)
      return "Lesson count must be 1-255";
    const xp = parseInt(form.xpPerLesson, 10);
    if (isNaN(xp) || xp < 0) return "XP per lesson must be >= 0";
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (isEdit) {
        // PATCH to update course
        const res = await fetch(
          `/api/admin/courses/${encodeURIComponent(form.courseId)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              isActive: true,
              xpPerLesson: parseInt(form.xpPerLesson, 10),
              creatorRewardXp: parseInt(form.creatorRewardXp, 10),
            }),
          },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
      } else {
        // POST to create course
        const trackId = TRACK_TYPES.indexOf(form.track as (typeof TRACK_TYPES)[number]);
        const diffIndex = DIFFICULTY_LEVELS.indexOf(
          form.difficulty as (typeof DIFFICULTY_LEVELS)[number],
        );

        const res = await fetch("/api/admin/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: form.courseId.trim(),
            creator: walletAddress,
            lessonCount: parseInt(form.lessonCount, 10),
            difficulty: diffIndex >= 0 ? diffIndex : 0,
            xpPerLesson: parseInt(form.xpPerLesson, 10),
            trackId: trackId >= 0 ? trackId : 0,
            trackLevel: 1,
            creatorRewardXp: parseInt(form.creatorRewardXp, 10),
            minCompletionsForReward: 10,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
      }

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      setError(msg);
    }

    setSubmitting(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg mx-4 rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--c-border-subtle)]">
          <h3 className="text-sm font-semibold text-[var(--c-text)]">
            {isEdit ? "Edit Course" : "Create Course"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[var(--c-border-subtle)] text-[var(--c-text-2)] hover:text-[var(--c-text)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="rounded-[2px] border border-[#EF4444]/20 bg-[#EF4444]/5 px-3 py-2">
              <p className="text-xs text-[#EF4444]">{error}</p>
            </div>
          )}

          {/* Course ID */}
          <div>
            <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1.5">
              Course ID
            </label>
            <Input
              value={form.courseId}
              onChange={(e) => updateField("courseId", e.target.value)}
              placeholder="intro-solana"
              disabled={isEdit}
              className="h-9 text-xs font-mono"
              maxLength={32}
            />
            <p className="text-[10px] text-[var(--c-text-dim)] mt-1">
              Unique identifier, used in PDA derivation. Cannot be changed.
            </p>
          </div>

          {/* Track and Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1.5">
                Track
              </label>
              <select
                value={form.track}
                onChange={(e) => updateField("track", e.target.value)}
                disabled={isEdit}
                className="w-full h-9 rounded-[2px] bg-[var(--c-bg)] border border-[var(--c-border-subtle)] px-3 text-xs text-[var(--c-text)] focus:outline-none focus:border-[#55E9AB] focus:ring-1 focus:ring-[#55E9AB] disabled:opacity-50"
              >
                {TRACK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TRACK_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1.5">
                Difficulty
              </label>
              <select
                value={form.difficulty}
                onChange={(e) => updateField("difficulty", e.target.value)}
                disabled={isEdit}
                className="w-full h-9 rounded-[2px] bg-[var(--c-bg)] border border-[var(--c-border-subtle)] px-3 text-xs text-[var(--c-text)] capitalize focus:outline-none focus:border-[#55E9AB] focus:ring-1 focus:ring-[#55E9AB] disabled:opacity-50"
              >
                {DIFFICULTY_LEVELS.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lesson Count and XP */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1.5">
                Lesson Count
              </label>
              <Input
                type="number"
                value={form.lessonCount}
                onChange={(e) => updateField("lessonCount", e.target.value)}
                disabled={isEdit}
                min={1}
                max={255}
                className="h-9 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1.5">
                XP per Lesson
              </label>
              <Input
                type="number"
                value={form.xpPerLesson}
                onChange={(e) => updateField("xpPerLesson", e.target.value)}
                min={0}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          {/* Creator Reward XP */}
          <div>
            <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1.5">
              Creator Reward XP
            </label>
            <Input
              type="number"
              value={form.creatorRewardXp}
              onChange={(e) => updateField("creatorRewardXp", e.target.value)}
              min={0}
              className="h-9 text-xs font-mono"
            />
            <p className="text-[10px] text-[var(--c-text-dim)] mt-1">
              XP awarded to the course creator per learner completion
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-[var(--c-border-subtle)]">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-1.5"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEdit ? "Update Course" : "Create Course"}
          </Button>
        </div>
      </div>
    </div>
  );
}
