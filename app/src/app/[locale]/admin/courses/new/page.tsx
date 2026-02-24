"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  TRACK_TYPES,
  TRACK_LABELS,
  TRACK_COLORS,
  DIFFICULTY_LEVELS,
} from "@/lib/constants";
import type { TrackType, DifficultyLevel } from "@/lib/constants";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function NewCoursePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [track, setTrack] = useState<TrackType>("rust");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("beginner");
  const [xpReward, setXpReward] = useState(500);
  const [estimatedHours, setEstimatedHours] = useState(4);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slug = slugify(title);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      setSubmitting(true);
      setError(null);

      try {
        const res = await fetch("/api/admin/sanity-courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            slug,
            description,
            track,
            difficulty,
            xpReward,
            estimatedHours,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create course");
        }

        const data = await res.json();
        const courseId = data.course?._id;
        if (courseId) {
          router.push(`/en/admin/courses/${courseId}`);
        } else {
          router.push("/en/admin");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create course",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [title, slug, description, track, difficulty, xpReward, estimatedHours, router],
  );

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/en/admin"
            className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] hover:bg-[var(--c-bg-elevated)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-[var(--c-text-2)]" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--c-text)]">
              Create New Course
            </h1>
            <p className="text-xs text-[var(--c-text-2)]">
              Set up course metadata, then add modules and lessons
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-[2px] border border-[#EF4444]/20 bg-[#EF4444]/5 p-4">
            <p className="text-sm text-[#EF4444]">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--c-text)] flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[var(--c-text-2)]" />
              Course Details
            </h2>

            <div>
              <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1.5">
                Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Introduction to Anchor Development"
                required
                maxLength={200}
              />
            </div>

            {/* Slug Preview */}
            {slug && (
              <div className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-[var(--c-text-2)]" />
                <span className="text-xs text-[var(--c-text-2)]">Slug:</span>
                <code className="text-xs font-mono text-[#00FFA3] bg-[var(--c-bg-elevated)] px-2 py-0.5 rounded-[1px]">
                  /courses/{slug}
                </code>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1.5">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what learners will gain from this course..."
                required
                rows={3}
                maxLength={500}
                className="flex w-full rounded-[2px] bg-[var(--c-bg)] border border-[var(--c-border-subtle)] px-3 py-2 text-sm text-[var(--c-text)] placeholder:text-[var(--c-text-2)] transition-colors focus:outline-none focus:border-[#55E9AB] focus:ring-1 focus:ring-[#55E9AB] resize-none"
              />
              <p className="text-[10px] text-[var(--c-text-dim)] mt-1">
                {description.length}/500
              </p>
            </div>
          </div>

          {/* Track & Difficulty */}
          <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--c-text)]">
              Classification
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1.5">
                  Track
                </label>
                <div className="flex flex-wrap gap-2">
                  {TRACK_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTrack(t)}
                      className={`px-3 py-1.5 text-xs font-mono rounded-[1px] border transition-all cursor-pointer ${
                        track === t
                          ? "border-current"
                          : "border-[var(--c-border-subtle)] text-[var(--c-text-2)] hover:border-[var(--c-border-prominent)]"
                      }`}
                      style={
                        track === t ? { color: TRACK_COLORS[t] } : undefined
                      }
                    >
                      {TRACK_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1.5">
                  Difficulty
                </label>
                <div className="flex gap-2">
                  {DIFFICULTY_LEVELS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className="cursor-pointer"
                    >
                      <Badge
                        variant={difficulty === d ? d : "default"}
                        className={
                          difficulty === d
                            ? ""
                            : "opacity-50 hover:opacity-75 transition-opacity"
                        }
                      >
                        {d}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* XP & Duration */}
          <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--c-text)]">
              Rewards & Duration
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1.5">
                  Total XP Reward
                </label>
                <Input
                  type="number"
                  value={xpReward}
                  onChange={(e) => setXpReward(Number(e.target.value))}
                  min={50}
                  max={10000}
                  step={50}
                />
                <p className="text-[10px] text-[var(--c-text-dim)] mt-1">
                  Distributed across lessons + completion bonus
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1.5">
                  Estimated Hours
                </label>
                <Input
                  type="number"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(Number(e.target.value))}
                  min={1}
                  max={100}
                  step={0.5}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href="/en/admin"
              className="text-sm text-[var(--c-text-2)] hover:text-[var(--c-text)] transition-colors"
            >
              Cancel
            </Link>
            <Button type="submit" disabled={submitting || !title.trim() || !description.trim()}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Course"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
