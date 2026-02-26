"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { PlatformLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useCourseFormStore,
  MAX_XP_PER_LESSON,
  MAX_COURSE_XP,
  type QuizQuestionDraft,
} from "@/stores/course-form-store";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { difficultyLabels, trackLabels } from "@/lib/constants";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  X,
  BookOpen,
  Layers,
  FileText,
  CheckCircle2,
  Send,
  Save,
  AlertTriangle,
  HelpCircle,
  Code2,
  ImagePlus,
  Loader2,
  Video,
} from "lucide-react";
import { useCourseCreationFee } from "@/hooks/use-course-creation-fee";

const steps = [
  { id: 1, title: "Course Info", icon: BookOpen },
  { id: 2, title: "Modules", icon: Layers },
  { id: 3, title: "Lessons", icon: FileText },
  { id: 4, title: "Review & Submit", icon: Send },
];

// ─── Quiz Editor ──────────────────────────────────────────────

function QuizEditor({ mi, li }: { mi: number; li: number }) {
  const store = useCourseFormStore();
  const lesson = store.modules[mi].lessons[li];
  const quiz = lesson.quiz;

  const updateQuiz = (partial: Partial<typeof quiz>) => {
    store.updateLessonQuiz(mi, li, { ...quiz, ...partial });
  };

  const updateQuestion = (qi: number, partial: Partial<QuizQuestionDraft>) => {
    const updated = quiz.questions.map((q, i) =>
      i === qi ? { ...q, ...partial } : q,
    );
    updateQuiz({ questions: updated });
  };

  const addQuestion = () => {
    updateQuiz({
      questions: [
        ...quiz.questions,
        { question: "", options: ["", ""], correctIndex: 0, explanation: "" },
      ],
    });
  };

  const removeQuestion = (qi: number) => {
    if (quiz.questions.length <= 1) return;
    updateQuiz({ questions: quiz.questions.filter((_, i) => i !== qi) });
  };

  const addOption = (qi: number) => {
    const q = quiz.questions[qi];
    if (q.options.length >= 6) return;
    updateQuestion(qi, { options: [...q.options, ""] });
  };

  const removeOption = (qi: number, oi: number) => {
    const q = quiz.questions[qi];
    if (q.options.length <= 2) return;
    const newOptions = q.options.filter((_, i) => i !== oi);
    const newCorrect =
      q.correctIndex >= newOptions.length ? 0 : q.correctIndex;
    updateQuestion(qi, { options: newOptions, correctIndex: newCorrect });
  };

  const updateOption = (qi: number, oi: number, value: string) => {
    const q = quiz.questions[qi];
    const newOptions = q.options.map((o, i) => (i === oi ? value : o));
    updateQuestion(qi, { options: newOptions });
  };

  return (
    <div className="space-y-4 rounded-lg border border-violet-200 dark:border-violet-900 bg-violet-50/50 dark:bg-violet-950/20 p-4">
      <div className="flex items-center gap-2">
        <HelpCircle className="h-4 w-4 text-violet-500" />
        <h4 className="text-sm font-semibold text-violet-700 dark:text-violet-300">
          Quiz Builder
        </h4>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium">Passing Score (%)</label>
        <Input
          type="number"
          value={quiz.passingScore}
          onChange={(e) =>
            updateQuiz({
              passingScore: Math.min(
                100,
                Math.max(1, Number(e.target.value)),
              ),
            })
          }
          min={1}
          max={100}
          className="h-9 w-32"
        />
      </div>

      {quiz.questions.map((q, qi) => (
        <div key={qi} className="rounded-lg border bg-background p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Question {qi + 1}
            </span>
            {quiz.questions.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeQuestion(qi)}
                className="h-7 px-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <textarea
            value={q.question}
            onChange={(e) => updateQuestion(qi, { question: e.target.value })}
            placeholder="Type your question..."
            rows={2}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <div className="space-y-2">
            <label className="text-xs font-medium">
              Options (select the correct one)
            </label>
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateQuestion(qi, { correctIndex: oi })}
                  className={`h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                    q.correctIndex === oi
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-muted-foreground/40 hover:border-muted-foreground"
                  }`}
                >
                  {q.correctIndex === oi && (
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  )}
                </button>
                <Input
                  value={opt}
                  onChange={(e) => updateOption(qi, oi, e.target.value)}
                  placeholder={`Option ${oi + 1}`}
                  className="h-9 flex-1"
                />
                {q.options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(qi, oi)}
                    className="h-7 px-1.5 text-muted-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
            {q.options.length < 6 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addOption(qi)}
                className="text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Option
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">
              Explanation (shown after answer)
            </label>
            <Input
              value={q.explanation}
              onChange={(e) =>
                updateQuestion(qi, { explanation: e.target.value })
              }
              placeholder="Why is this the correct answer?"
              className="h-9"
            />
          </div>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={addQuestion}>
        <Plus className="h-4 w-4 mr-1" />
        Add Question
      </Button>
    </div>
  );
}

// ─── Challenge Editor ─────────────────────────────────────────

function ChallengeEditor({ mi, li }: { mi: number; li: number }) {
  const store = useCourseFormStore();
  const lesson = store.modules[mi].lessons[li];
  const challenge = lesson.challenge;
  const [objectiveInput, setObjectiveInput] = useState("");
  const [hintInput, setHintInput] = useState("");

  const updateChallenge = (partial: Partial<typeof challenge>) => {
    store.updateLessonChallenge(mi, li, { ...challenge, ...partial });
  };

  return (
    <div className="space-y-4 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
      <div className="flex items-center gap-2">
        <Code2 className="h-4 w-4 text-emerald-500" />
        <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          Challenge Builder
        </h4>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium">Prompt / Instructions</label>
        <textarea
          value={challenge.prompt}
          onChange={(e) => updateChallenge({ prompt: e.target.value })}
          placeholder="Describe what the learner needs to do..."
          rows={3}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium">Language</label>
        <select
          value={challenge.language}
          onChange={(e) =>
            updateChallenge({
              language: e.target.value as "rust" | "typescript" | "json",
            })
          }
          className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="typescript">TypeScript</option>
          <option value="rust">Rust</option>
          <option value="json">JSON</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium">Starter Code</label>
        <textarea
          value={challenge.starterCode}
          onChange={(e) => updateChallenge({ starterCode: e.target.value })}
          placeholder="// Starting code for the learner..."
          rows={5}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Objectives */}
      <div className="space-y-2">
        <label className="text-xs font-medium">Objectives</label>
        <div className="flex gap-2">
          <Input
            value={objectiveInput}
            onChange={(e) => setObjectiveInput(e.target.value)}
            placeholder="Add an objective"
            className="h-9"
            onKeyDown={(e) => {
              if (e.key === "Enter" && objectiveInput.trim()) {
                updateChallenge({
                  objectives: [
                    ...challenge.objectives,
                    objectiveInput.trim(),
                  ],
                });
                setObjectiveInput("");
              }
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => {
              if (objectiveInput.trim()) {
                updateChallenge({
                  objectives: [
                    ...challenge.objectives,
                    objectiveInput.trim(),
                  ],
                });
                setObjectiveInput("");
              }
            }}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        {challenge.objectives.length > 0 && (
          <div className="space-y-1">
            {challenge.objectives.map((obj, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm rounded-lg bg-background px-3 py-1.5 border"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="flex-1">{obj}</span>
                <button
                  onClick={() =>
                    updateChallenge({
                      objectives: challenge.objectives.filter(
                        (_, j) => j !== i,
                      ),
                    })
                  }
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hints */}
      <div className="space-y-2">
        <label className="text-xs font-medium">Hints (optional)</label>
        <div className="flex gap-2">
          <Input
            value={hintInput}
            onChange={(e) => setHintInput(e.target.value)}
            placeholder="Add a hint"
            className="h-9"
            onKeyDown={(e) => {
              if (e.key === "Enter" && hintInput.trim()) {
                updateChallenge({
                  hints: [...challenge.hints, hintInput.trim()],
                });
                setHintInput("");
              }
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => {
              if (hintInput.trim()) {
                updateChallenge({
                  hints: [...challenge.hints, hintInput.trim()],
                });
                setHintInput("");
              }
            }}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        {challenge.hints.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {challenge.hints.map((hint, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                {hint}
                <button
                  onClick={() =>
                    updateChallenge({
                      hints: challenge.hints.filter((_, j) => j !== i),
                    })
                  }
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function CreateCoursePage() {
  const router = useRouter();
  const store = useCourseFormStore();
  const [submitting, setSubmitting] = useState(false);
  const [whatYouLearnInput, setWhatYouLearnInput] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { payFee, paying, feeSol } = useCourseCreationFee();

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setThumbnailFile(file);
    const previewUrl = URL.createObjectURL(file);
    store.setField("thumbnailPreview", previewUrl);
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    store.setField("thumbnailPreview", null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getToken = async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  const totalLessons = store.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0,
  );
  const totalXp = store.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((ls, l) => ls + l.xp, 0),
    0,
  );
  const xpOverBudget = totalXp > MAX_COURSE_XP;

  const handleSaveDraft = async () => {
    if (xpOverBudget) {
      toast.error(
        `Total course XP (${totalXp}) exceeds maximum of ${MAX_COURSE_XP}`,
      );
      return null;
    }
    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Please sign in first");
        return null;
      }

      const formData = new FormData();
      formData.append(
        "data",
        JSON.stringify({
          title: store.title,
          description: store.description,
          difficulty: store.difficulty,
          trackId: store.trackId,
          duration: store.duration,
          xpPerLesson: store.xpPerLesson,
          modules: store.modules,
          whatYouLearn: store.whatYouLearn,
          instructor: {
            name: store.instructorName || undefined,
            bio: store.instructorBio || undefined,
          },
        }),
      );
      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }

      const res = await fetch("/api/courses/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const { id } = await res.json();
        toast.success("Course draft saved!");
        return id;
      } else {
        const { error } = await res.json();
        toast.error(error ?? "Failed to save draft");
        return null;
      }
    } catch {
      toast.error("Failed to save");
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (xpOverBudget) {
      toast.error(
        `Total course XP (${totalXp}) exceeds maximum of ${MAX_COURSE_XP}`,
      );
      return;
    }
    setSubmitting(true);
    try {
      // Collect course creation fee before saving
      let paymentSig: string;
      try {
        paymentSig = await payFee();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Payment failed";
        toast.error(msg);
        return;
      }

      const courseId = await handleSaveDraft();
      if (!courseId) return;

      const token = await getToken();
      const res = await fetch("/api/courses/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId, paymentSignature: paymentSig }),
      });

      if (res.ok) {
        toast.success("Course submitted for review!");
        store.reset();
        router.push("/my-courses");
      } else {
        const { error } = await res.json();
        toast.error(error ?? "Failed to submit");
      }
    } catch {
      toast.error("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (store.currentStep) {
      case 1:
        return store.title.trim() && store.description.trim();
      case 2:
        return (
          store.modules.length > 0 && store.modules.every((m) => m.title.trim())
        );
      case 3:
        return store.modules.every(
          (m) =>
            m.lessons.length > 0 && m.lessons.every((l) => l.title.trim()),
        );
      default:
        return true;
    }
  };

  return (
    <ProtectedRoute requireWallet>
      <PlatformLayout>
        <div className="container mx-auto px-4 py-8 lg:py-12 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              Create a Course
            </h1>
            <p className="text-muted-foreground mt-1">
              Share your knowledge with the Solana community
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            {steps.map((step, i) => {
              const isActive = store.currentStep === step.id;
              const isDone = store.currentStep > step.id;
              return (
                <div key={step.id} className="flex items-center gap-2">
                  {i > 0 && (
                    <div
                      className={`h-px w-8 ${isDone ? "bg-primary" : "bg-border"}`}
                    />
                  )}
                  <button
                    onClick={() => isDone && store.setStep(step.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isDone
                          ? "bg-primary/10 text-primary cursor-pointer"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                    {step.title}
                  </button>
                </div>
              );
            })}
          </div>

          {/* ───── Step 1: Course Info ───── */}
          {store.currentStep === 1 && (
            <div className="space-y-6">
              <div className="rounded-xl border bg-card p-6 space-y-5">
                <h2 className="font-semibold text-lg">Basic Information</h2>

                {/* Thumbnail upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Course Thumbnail</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleThumbnailSelect}
                  />
                  {store.thumbnailPreview ? (
                    <div className="relative group w-full max-w-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={store.thumbnailPreview}
                        alt="Course thumbnail preview"
                        className="rounded-lg border object-cover w-full aspect-video"
                      />
                      <button
                        onClick={removeThumbnail}
                        className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 bg-muted/30 hover:bg-muted/50 transition-colors w-full max-w-xs aspect-video cursor-pointer"
                    >
                      <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
                      <span className="text-sm text-muted-foreground">Click to upload thumbnail</span>
                      <span className="text-xs text-muted-foreground/70">JPEG, PNG, WebP or GIF · Max 5 MB</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Course Title *</label>
                  <Input
                    value={store.title}
                    onChange={(e) => store.setField("title", e.target.value)}
                    placeholder="e.g. Building PDAs with Anchor"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description *</label>
                  <textarea
                    value={store.description}
                    onChange={(e) =>
                      store.setField("description", e.target.value)
                    }
                    placeholder="What will learners gain from this course?"
                    rows={4}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Difficulty *</label>
                    <div className="flex gap-2">
                      {([1, 2, 3] as const).map((d) => (
                        <Button
                          key={d}
                          variant={store.difficulty === d ? "default" : "outline"}
                          size="sm"
                          onClick={() => store.setField("difficulty", d)}
                        >
                          {difficultyLabels[d]}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Track</label>
                    <select
                      value={store.trackId}
                      onChange={(e) =>
                        store.setField("trackId", Number(e.target.value))
                      }
                      className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {Object.entries(trackLabels).map(([id, label]) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Estimated Duration
                    </label>
                    <Input
                      value={store.duration}
                      onChange={(e) =>
                        store.setField("duration", e.target.value)
                      }
                      placeholder='e.g. "4 hours", "2 weeks"'
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      XP Per Lesson (max {MAX_XP_PER_LESSON})
                    </label>
                    <Input
                      type="number"
                      value={store.xpPerLesson}
                      onChange={(e) =>
                        store.setField(
                          "xpPerLesson",
                          Math.min(
                            MAX_XP_PER_LESSON,
                            Math.max(1, Number(e.target.value)),
                          ),
                        )
                      }
                      min={1}
                      max={MAX_XP_PER_LESSON}
                    />
                  </div>
                </div>
              </div>

              {/* Instructor */}
              <div className="rounded-xl border bg-card p-6 space-y-5">
                <h2 className="font-semibold text-lg">Instructor</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={store.instructorName}
                      onChange={(e) =>
                        store.setField("instructorName", e.target.value)
                      }
                      placeholder="Your name or alias"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bio</label>
                    <Input
                      value={store.instructorBio}
                      onChange={(e) =>
                        store.setField("instructorBio", e.target.value)
                      }
                      placeholder="Short bio"
                    />
                  </div>
                </div>
              </div>

              {/* What You'll Learn */}
              <div className="rounded-xl border bg-card p-6 space-y-4">
                <h2 className="font-semibold text-lg">
                  What You&apos;ll Learn
                </h2>
                <div className="flex gap-2">
                  <Input
                    value={whatYouLearnInput}
                    onChange={(e) => setWhatYouLearnInput(e.target.value)}
                    placeholder="Add a learning objective"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && whatYouLearnInput.trim()) {
                        store.addWhatYouLearn(whatYouLearnInput.trim());
                        setWhatYouLearnInput("");
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (whatYouLearnInput.trim()) {
                        store.addWhatYouLearn(whatYouLearnInput.trim());
                        setWhatYouLearnInput("");
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {store.whatYouLearn.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {store.whatYouLearn.map((item, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {item}
                        <button onClick={() => store.removeWhatYouLearn(i)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ───── Step 2: Modules ───── */}
          {store.currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">
                  Modules ({store.modules.length})
                </h2>
                <Button variant="outline" size="sm" onClick={store.addModule}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Module
                </Button>
              </div>

              {store.modules.map((mod, mi) => (
                <div
                  key={mi}
                  className="rounded-xl border bg-card p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm text-muted-foreground">
                      Module {mi + 1}
                    </h3>
                    {store.modules.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => store.removeModule(mi)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Title *</label>
                      <Input
                        value={mod.title}
                        onChange={(e) =>
                          store.updateModule(mi, "title", e.target.value)
                        }
                        placeholder={`Module ${mi + 1} title`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        value={mod.description}
                        onChange={(e) =>
                          store.updateModule(mi, "description", e.target.value)
                        }
                        placeholder="Brief description of this module"
                        rows={2}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {mod.lessons.length} lesson
                    {mod.lessons.length !== 1 ? "s" : ""}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ───── Step 3: Lessons ───── */}
          {store.currentStep === 3 && (
            <div className="space-y-6">
              {/* XP budget bar */}
              <div
                className={`rounded-xl border p-4 ${xpOverBudget ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30" : "bg-card"}`}
              >
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium flex items-center gap-2">
                    {xpOverBudget && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    XP Budget
                  </span>
                  <span
                    className={`font-mono font-semibold ${xpOverBudget ? "text-red-600 dark:text-red-400" : ""}`}
                  >
                    {totalXp} / {MAX_COURSE_XP} XP
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${xpOverBudget ? "bg-red-500" : "bg-primary"}`}
                    style={{
                      width: `${Math.min(100, (totalXp / MAX_COURSE_XP) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {totalLessons} lesson{totalLessons !== 1 ? "s" : ""} · Max{" "}
                  {MAX_XP_PER_LESSON} XP per lesson · Max {MAX_COURSE_XP} XP
                  total
                </p>
              </div>

              {store.modules.map((mod, mi) => (
                <div key={mi} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                      Module {mi + 1}: {mod.title || "(untitled)"}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => store.addLesson(mi)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Lesson
                    </Button>
                  </div>

                  {mod.lessons.map((les, li) => (
                    <div
                      key={li}
                      className="rounded-xl border bg-card p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-muted-foreground">
                          Lesson {mi + 1}.{li + 1}
                        </span>
                        {mod.lessons.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => store.removeLesson(mi, li)}
                            className="text-destructive hover:text-destructive h-7 px-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">Title *</label>
                          <Input
                            value={les.title}
                            onChange={(e) =>
                              store.updateLesson(
                                mi,
                                li,
                                "title",
                                e.target.value,
                              )
                            }
                            placeholder="Lesson title"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">Type</label>
                          <select
                            value={les.type}
                            onChange={(e) =>
                              store.updateLesson(
                                mi,
                                li,
                                "type",
                                e.target.value,
                              )
                            }
                            className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="content">Content</option>
                            <option value="quiz">Quiz</option>
                            <option value="challenge">Challenge</option>
                            <option value="video">Video</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium">
                          Description
                        </label>
                        <Input
                          value={les.description}
                          onChange={(e) =>
                            store.updateLesson(
                              mi,
                              li,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="Brief lesson summary"
                          className="h-9"
                        />
                      </div>

                      {/* Content editor — only for "content" type */}
                      {les.type === "content" && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">
                            Lesson Content
                          </label>
                          <textarea
                            value={les.content}
                            onChange={(e) =>
                              store.updateLesson(
                                mi,
                                li,
                                "content",
                                e.target.value,
                              )
                            }
                            placeholder="Write your lesson content here..."
                            rows={6}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      )}

                      {/* Video lesson */}
                      {les.type === "video" && (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium flex items-center gap-1.5">
                              <Video className="h-3.5 w-3.5 text-red-500" />
                              YouTube Video URL *
                            </label>
                            <Input
                              value={les.videoUrl}
                              onChange={(e) =>
                                store.updateLesson(
                                  mi,
                                  li,
                                  "videoUrl",
                                  e.target.value,
                                )
                              }
                              placeholder="https://www.youtube.com/watch?v=..."
                              className="h-9"
                            />
                            <p className="text-[11px] text-muted-foreground">
                              Supports youtube.com/watch, youtu.be, and youtube.com/embed URLs
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                              Lesson Content (optional)
                            </label>
                            <textarea
                              value={les.content}
                              onChange={(e) =>
                                store.updateLesson(
                                  mi,
                                  li,
                                  "content",
                                  e.target.value,
                                )
                              }
                              placeholder="Additional notes or context for this video lesson..."
                              rows={4}
                              className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                        </div>
                      )}

                      {/* Quiz builder */}
                      {les.type === "quiz" && <QuizEditor mi={mi} li={li} />}

                      {/* Challenge builder */}
                      {les.type === "challenge" && (
                        <ChallengeEditor mi={mi} li={li} />
                      )}

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">
                            XP Reward (max {MAX_XP_PER_LESSON})
                          </label>
                          <Input
                            type="number"
                            value={les.xp}
                            onChange={(e) =>
                              store.updateLesson(
                                mi,
                                li,
                                "xp",
                                Number(e.target.value),
                              )
                            }
                            min={0}
                            max={MAX_XP_PER_LESSON}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">
                            Duration
                          </label>
                          <Input
                            value={les.duration}
                            onChange={(e) =>
                              store.updateLesson(
                                mi,
                                li,
                                "duration",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. 15 min"
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* ───── Step 4: Review & Submit ───── */}
          {store.currentStep === 4 && (
            <div className="space-y-6">
              {/* XP warning */}
              {xpOverBudget && (
                <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-5 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-400">
                      XP Over Budget
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Total XP is {totalXp} but the maximum is {MAX_COURSE_XP}.
                      Go back to Step 3 and reduce lesson XP values.
                    </p>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="rounded-xl border bg-card p-6 space-y-4">
                <h2 className="font-semibold text-lg">Course Summary</h2>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Title</p>
                    <p className="font-medium">{store.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Difficulty</p>
                    <p className="font-medium">
                      {difficultyLabels[store.difficulty]}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Track</p>
                    <p className="font-medium">{trackLabels[store.trackId]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-medium">{store.duration || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total XP</p>
                    <p
                      className={`font-medium ${xpOverBudget ? "text-red-600" : ""}`}
                    >
                      {totalXp} / {MAX_COURSE_XP}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Total Lessons
                    </p>
                    <p className="font-medium">{totalLessons}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Description
                  </p>
                  <p className="text-sm">{store.description}</p>
                </div>

                {store.whatYouLearn.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      What You&apos;ll Learn
                    </p>
                    <ul className="space-y-1">
                      {store.whatYouLearn.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Structure preview */}
              <div className="rounded-xl border bg-card p-6 space-y-4">
                <h2 className="font-semibold text-lg">Structure</h2>
                {store.modules.map((mod, mi) => (
                  <div key={mi} className="space-y-2">
                    <h3 className="font-medium text-sm">
                      Module {mi + 1}: {mod.title}
                    </h3>
                    <div className="pl-4 space-y-1">
                      {mod.lessons.map((les, li) => (
                        <div
                          key={li}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="text-xs font-mono text-muted-foreground w-8">
                            {mi + 1}.{li + 1}
                          </span>
                          <span>{les.title}</span>
                          <Badge
                            variant="outline"
                            className="text-xs ml-auto"
                          >
                            {les.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {les.xp} XP
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Info box */}
              <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-5">
                <p className="text-sm">
                  <strong>What happens next?</strong> You can save as a draft
                  and continue editing later, or submit for review. An admin will
                  review your course and either approve it (making it live for
                  all users) or send feedback.
                </p>
                <p className="text-sm mt-2 text-amber-700 dark:text-amber-400">
                  Submitting for review requires a one-time fee of{" "}
                  <strong>{feeSol} SOL</strong> to cover on-chain costs.
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => store.setStep(store.currentStep - 1)}
              disabled={store.currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              {store.currentStep === 4 ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={submitting || xpOverBudget}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {submitting ? "Saving..." : "Save Draft"}
                  </Button>
                  <Button
                    onClick={handleSubmitForReview}
                    disabled={submitting || paying || xpOverBudget}
                  >
                    {paying ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {paying
                      ? "Processing payment..."
                      : submitting
                        ? "Submitting..."
                        : `Submit for Review (${feeSol} SOL)`}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => store.setStep(store.currentStep + 1)}
                  disabled={!canProceed()}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </PlatformLayout>
    </ProtectedRoute>
  );
}
