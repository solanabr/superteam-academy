"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Save, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCreatorBasic } from "./course-creator-step-basic";
import { CourseCreatorModules } from "./course-creator-step-modules";
import { CourseCreatorSettings } from "./course-creator-step-settings";
import { CourseCreatorPreview } from "./course-creator-step-preview";
import {
  CREATOR_STEPS,
  INITIAL_DRAFT,
  slugify,
  calcTotalXP,
} from "./course-creator-types";
import type { DraftCourse, CreatorStep } from "./course-creator-types";

const DRAFT_KEY = "sta_course_creator_draft";
const PUBLISHED_KEY = "sta_published_courses";

interface CourseCreatorProps {
  availableCourses?: { slug: string; title: string }[];
}

export function CourseCreator({ availableCourses = [] }: CourseCreatorProps) {
  const t = useTranslations("admin.creator");
  const router = useRouter();

  const [step, setStep] = useState<CreatorStep>("basic");
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");

  const [draft, setDraft] = useState<DraftCourse>(() => {
    if (typeof window === "undefined") return INITIAL_DRAFT;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? (JSON.parse(saved) as DraftCourse) : INITIAL_DRAFT;
    } catch {
      return INITIAL_DRAFT;
    }
  });

  const currentIndex = CREATOR_STEPS.findIndex((s) => s.key === step);

  const updateDraft = useCallback((updates: Partial<DraftCourse>) => {
    setDraft((prev) => {
      const next = { ...prev, ...updates };
      if (updates.title !== undefined) {
        next.slug = slugify(updates.title);
      }
      return next;
    });
  }, []);

  const saveDraft = useCallback(() => {
    const toSave = {
      ...draft,
      xpTotal: draft.xpTotal || calcTotalXP(draft.modules),
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(toSave));
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      // localStorage might be unavailable
    }
  }, [draft]);

  const handlePublish = useCallback(() => {
    const finalCourse = {
      ...draft,
      xpTotal: draft.xpTotal || calcTotalXP(draft.modules),
      publishedAt: new Date().toISOString(),
      id: `draft-${draft.slug || Date.now()}`,
    };
    try {
      const existing = JSON.parse(localStorage.getItem(PUBLISHED_KEY) ?? "[]") as unknown[];
      existing.push(finalCourse);
      localStorage.setItem(PUBLISHED_KEY, JSON.stringify(existing));
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // storage unavailable
    }
    router.push("/admin");
  }, [draft, router]);

  const canAdvance = (): boolean => {
    if (step === "basic") {
      return (
        draft.title.trim().length > 0 &&
        draft.description.trim().length > 0 &&
        draft.creator.trim().length > 0
      );
    }
    if (step === "modules") return draft.modules.length > 0;
    return true;
  };

  function goToStep(target: CreatorStep) {
    const targetIndex = CREATOR_STEPS.findIndex((s) => s.key === target);
    // Only allow going back freely; forward requires passing validation
    if (targetIndex <= currentIndex) {
      setStep(target);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-st-green/10">
            <PenSquare className="h-5 w-5 text-st-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={saveDraft}
          className="shrink-0"
        >
          <Save className="mr-2 h-4 w-4" />
          {saveState === "saved" ? t("saved") : t("saveDraft")}
        </Button>
      </div>

      {/* Step Indicator */}
      <div className="mb-10">
        <div className="flex items-center">
          {CREATOR_STEPS.map((s, idx) => (
            <div key={s.key} className="flex flex-1 items-center">
              <button
                type="button"
                onClick={() => goToStep(s.key)}
                className="flex flex-col items-center gap-1.5 focus-visible:outline-none"
                aria-current={s.key === step ? "step" : undefined}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                    s.key === step
                      ? "bg-st-green text-white shadow-md ring-2 ring-st-green/30"
                      : idx < currentIndex
                        ? "bg-st-green/20 text-st-green"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {idx + 1}
                </div>
                <span
                  className={`text-xs font-medium transition-colors ${
                    s.key === step
                      ? "text-st-green"
                      : idx < currentIndex
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {t(`steps.${s.key}`)}
                </span>
              </button>
              {idx < CREATOR_STEPS.length - 1 && (
                <div
                  className={`mx-2 mb-5 h-0.5 flex-1 transition-colors ${
                    idx < currentIndex ? "bg-st-green/40" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[420px]">
        {step === "basic" && (
          <CourseCreatorBasic draft={draft} onChange={updateDraft} />
        )}
        {step === "modules" && (
          <CourseCreatorModules draft={draft} onChange={updateDraft} />
        )}
        {step === "settings" && (
          <CourseCreatorSettings
            draft={draft}
            onChange={updateDraft}
            availableCourses={availableCourses}
          />
        )}
        {step === "preview" && (
          <CourseCreatorPreview draft={draft} onPublish={handlePublish} />
        )}
      </div>

      {/* Navigation Footer */}
      <div className="mt-8 flex items-center justify-between border-t pt-6">
        <Button
          variant="outline"
          onClick={() => {
            if (currentIndex > 0) {
              setStep(CREATOR_STEPS[currentIndex - 1].key);
            } else {
              router.push("/admin");
            }
          }}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {currentIndex === 0 ? t("backToAdmin") : t("back")}
        </Button>

        {step !== "preview" && (
          <Button
            onClick={() => setStep(CREATOR_STEPS[currentIndex + 1].key)}
            disabled={!canAdvance()}
          >
            {t("next")}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
