"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Settings,
  Eye,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  TRACK_TYPES,
  TRACK_LABELS,
  TRACK_COLORS,
  DIFFICULTY_LEVELS,
} from "@/lib/constants";
import type { TrackType, DifficultyLevel } from "@/lib/constants";
import { ModuleManager } from "@/components/admin/module-manager";
import { CoursePreview } from "@/components/admin/course-preview";
import { OnchainRegistration } from "@/components/admin/onchain-registration";
import { PublishDialog } from "@/components/admin/publish-dialog";

interface LessonData {
  _id: string;
  title: string;
  slug: string;
  type: string;
  xpReward: number;
  estimatedMinutes: number;
  order: number;
  markdownContent?: string;
  challenge?: {
    instructions: string;
    starterCode: string;
    solution: string;
    language: string;
  };
}

interface ModuleData {
  _id: string;
  title: string;
  description: string;
  order: number;
  lessons: LessonData[];
}

interface CourseData {
  _id: string;
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  track: TrackType;
  difficulty: DifficultyLevel;
  estimatedHours: number;
  xpReward: number;
  published: boolean;
  learningOutcomes: string[];
  image: unknown;
  modules: ModuleData[];
}

export default function CourseEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { publicKey } = useWallet();
  const courseId = params.id as string;

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  // Editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [track, setTrack] = useState<TrackType>("rust");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("beginner");
  const [xpReward, setXpReward] = useState(500);
  const [estimatedHours, setEstimatedHours] = useState(4);
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>([]);
  const [newOutcome, setNewOutcome] = useState("");

  // Debounce timer for auto-save
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasUnsavedRef = useRef(false);

  const wallet = publicKey?.toBase58() ?? "";

  // Fetch course data
  const fetchCourse = useCallback(async () => {
    if (!wallet) return;
    try {
      const res = await fetch(
        `/api/admin/sanity-courses/${courseId}?wallet=${wallet}`,
      );
      if (!res.ok) throw new Error("Failed to fetch course");
      const data = await res.json();
      const c = data.course as CourseData;
      setCourse(c);
      setTitle(c.title ?? "");
      setDescription(c.description ?? "");
      setLongDescription(c.longDescription ?? "");
      setTrack((c.track as TrackType) ?? "rust");
      setDifficulty((c.difficulty as DifficultyLevel) ?? "beginner");
      setXpReward(c.xpReward ?? 500);
      setEstimatedHours(c.estimatedHours ?? 4);
      setLearningOutcomes(c.learningOutcomes ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load course",
      );
    } finally {
      setLoading(false);
    }
  }, [courseId, wallet]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  // Auto-save with debounce
  const triggerAutoSave = useCallback(() => {
    hasUnsavedRef.current = true;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (!hasUnsavedRef.current || !wallet) return;
      setSaving(true);
      try {
        const res = await fetch(`/api/admin/sanity-courses/${courseId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet,
            title,
            description,
            longDescription,
            track,
            difficulty,
            xpReward,
            estimatedHours,
            learningOutcomes,
          }),
        });
        if (!res.ok) throw new Error("Save failed");
        hasUnsavedRef.current = false;
      } catch {
        // Silent fail — user will see the saving indicator
      } finally {
        setSaving(false);
      }
    }, 1500);
  }, [wallet, courseId, title, description, longDescription, track, difficulty, xpReward, estimatedHours, learningOutcomes]);

  useEffect(() => {
    if (course) triggerAutoSave();
  }, [title, description, longDescription, track, difficulty, xpReward, estimatedHours, learningOutcomes, triggerAutoSave, course]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const addOutcome = () => {
    if (newOutcome.trim()) {
      setLearningOutcomes([...learningOutcomes, newOutcome.trim()]);
      setNewOutcome("");
    }
  };

  const removeOutcome = (idx: number) => {
    setLearningOutcomes(learningOutcomes.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--c-text-2)]" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="rounded-[2px] border border-[#EF4444]/20 bg-[#EF4444]/5 p-6 text-center">
            <p className="text-sm text-[#EF4444]">
              {error || "Course not found"}
            </p>
            <Link
              href="/en/admin"
              className="text-xs text-[var(--c-text-2)] hover:text-[var(--c-text)] mt-3 inline-block"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/en/admin"
              className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] hover:bg-[var(--c-bg-elevated)] transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-[var(--c-text-2)]" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-[var(--c-text)]">
                {title || "Untitled Course"}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant={course.published ? "beginner" : "default"}
                  className="text-[10px]"
                >
                  {course.published ? "Published" : "Draft"}
                </Badge>
                {saving && (
                  <span className="flex items-center gap-1 text-[10px] text-[var(--c-text-2)]">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPublishDialog(true)}
            >
              {course.published ? "Unpublish" : "Publish"}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="modules">
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              Modules
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-5 space-y-4">
                <h2 className="text-sm font-semibold text-[var(--c-text)]">
                  Basic Information
                </h2>

                <div>
                  <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1.5">
                    Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Course title"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1.5">
                    Short Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description..."
                    rows={2}
                    maxLength={500}
                    className="flex w-full rounded-[2px] bg-[var(--c-bg)] border border-[var(--c-border-subtle)] px-3 py-2 text-sm text-[var(--c-text)] placeholder:text-[var(--c-text-2)] transition-colors focus:outline-none focus:border-[#55E9AB] focus:ring-1 focus:ring-[#55E9AB] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1.5">
                    Long Description
                  </label>
                  <textarea
                    value={longDescription}
                    onChange={(e) => setLongDescription(e.target.value)}
                    placeholder="Detailed description of the course..."
                    rows={6}
                    className="flex w-full rounded-[2px] bg-[var(--c-bg)] border border-[var(--c-border-subtle)] px-3 py-2 text-sm text-[var(--c-text)] placeholder:text-[var(--c-text-2)] transition-colors focus:outline-none focus:border-[#55E9AB] focus:ring-1 focus:ring-[#55E9AB] resize-none"
                  />
                </div>
              </div>

              {/* Learning Outcomes */}
              <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-5 space-y-4">
                <h2 className="text-sm font-semibold text-[var(--c-text)]">
                  Learning Outcomes
                </h2>
                <div className="space-y-2">
                  {learningOutcomes.map((outcome, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] px-3 py-2"
                    >
                      <span className="text-xs font-mono text-[#00FFA3] shrink-0">
                        {idx + 1}.
                      </span>
                      <span className="text-sm text-[var(--c-text)] flex-1">
                        {outcome}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeOutcome(idx)}
                        className="text-[var(--c-text-2)] hover:text-[#EF4444] transition-colors text-xs cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newOutcome}
                    onChange={(e) => setNewOutcome(e.target.value)}
                    placeholder="Add a learning outcome..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addOutcome();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOutcome}
                    disabled={!newOutcome.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules">
            <ModuleManager
              courseId={courseId}
              modules={course.modules ?? []}
              wallet={wallet}
              onUpdate={fetchCourse}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-5 space-y-4">
                <h2 className="text-sm font-semibold text-[var(--c-text)]">
                  Classification
                </h2>

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
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1.5">
                      Estimated Hours
                    </label>
                    <Input
                      type="number"
                      value={estimatedHours}
                      onChange={(e) =>
                        setEstimatedHours(Number(e.target.value))
                      }
                      min={1}
                      max={100}
                      step={0.5}
                    />
                  </div>
                </div>
              </div>

              {/* On-chain Registration */}
              <OnchainRegistration
                courseId={courseId}
                courseSlug={course.slug}
              />
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <CoursePreview
              course={{
                title,
                description,
                longDescription,
                track,
                difficulty,
                xpReward,
                estimatedHours,
                learningOutcomes,
                modules: course.modules ?? [],
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Publish Dialog */}
        {showPublishDialog && (
          <PublishDialog
            courseId={courseId}
            title={title}
            description={description}
            modules={course.modules ?? []}
            published={course.published}
            onClose={() => setShowPublishDialog(false)}
            onPublished={() => {
              setShowPublishDialog(false);
              fetchCourse();
            }}
          />
        )}
      </div>
    </div>
  );
}
