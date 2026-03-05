"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LocaleField } from "./locale-field";
import { LocaleTextarea } from "./locale-textarea";
import { LocaleMarkdownField } from "./locale-markdown-field";
import { Trash2, Plus } from "lucide-react";
import type { LessonForm, LocaleString, LocaleText } from "@/types/admin";

interface LessonEditorProps {
  lesson: LessonForm;
  onChange: (lesson: LessonForm) => void;
  onRemove: () => void;
}

const emptyLocale = (): LocaleString => ({ pt: "", en: "", es: "" });
const emptyLocaleText = (): LocaleText => ({ pt: "", en: "", es: "" });

export function LessonEditor({
  lesson,
  onChange,
  onRemove,
}: LessonEditorProps) {
  const t = useTranslations("admin");

  const update = (patch: Partial<LessonForm>) =>
    onChange({ ...lesson, ...patch });

  return (
    <div className="space-y-4 rounded-lg border border-border/50 bg-background/50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">
          {lesson.title.pt || t("lessonTitle")}
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <LocaleField
          value={lesson.title}
          onChange={(title) => update({ title })}
          label={t("lessonTitle")}
          required
        />
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("slug")}</label>
          <Input
            value={lesson.slug}
            onChange={(e) => update({ slug: e.target.value })}
            placeholder="lesson-slug"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("lessonType")}</label>
          <select
            value={lesson.lessonType}
            onChange={(e) =>
              update({ lessonType: e.target.value as "content" | "challenge" })
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="content">{t("contentType")}</option>
            <option value="challenge">{t("challengeType")}</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("durationMinutes")}</label>
          <Input
            type="number"
            value={lesson.durationMinutes}
            onChange={(e) =>
              update({ durationMinutes: Number(e.target.value) })
            }
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("xpReward")}</label>
          <Input
            type="number"
            value={lesson.xpReward}
            onChange={(e) => update({ xpReward: Number(e.target.value) })}
          />
        </div>
      </div>

      {lesson.lessonType === "content" && (
        <>
          <LocaleMarkdownField
            value={lesson.content ?? emptyLocaleText()}
            onChange={(content) => update({ content })}
            label={t("lessonContent")}
          />

          {/* Exercise (optional) */}
          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer text-sm font-medium">
              {t("exercise")}
            </summary>
            <div className="mt-3 space-y-3">
              <LocaleField
                value={lesson.exercise?.question ?? emptyLocale()}
                onChange={(question) =>
                  update({
                    exercise: {
                      question,
                      options: lesson.exercise?.options ?? [],
                      correctIndex: lesson.exercise?.correctIndex ?? 0,
                    },
                  })
                }
                label={t("question")}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("options")}</label>
                {(lesson.exercise?.options ?? []).map((opt, oi) => (
                  <div key={oi} className="flex items-start gap-2">
                    <span className="mt-2.5 text-xs font-mono text-muted-foreground">
                      {oi}
                    </span>
                    <div className="flex-1">
                      <LocaleField
                        value={opt}
                        onChange={(newOpt) => {
                          const newOptions = [
                            ...(lesson.exercise?.options ?? []),
                          ];
                          newOptions[oi] = newOpt;
                          update({
                            exercise: {
                              ...lesson.exercise!,
                              options: newOptions,
                            },
                          });
                        }}
                        label=""
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-1"
                      onClick={() => {
                        const newOptions = (
                          lesson.exercise?.options ?? []
                        ).filter((_, i) => i !== oi);
                        update({
                          exercise: {
                            ...lesson.exercise!,
                            options: newOptions,
                          },
                        });
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    update({
                      exercise: {
                        question: lesson.exercise?.question ?? emptyLocale(),
                        options: [
                          ...(lesson.exercise?.options ?? []),
                          emptyLocale(),
                        ],
                        correctIndex: lesson.exercise?.correctIndex ?? 0,
                      },
                    })
                  }
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {t("addOption")}
                </Button>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {t("correctIndex")}
                </label>
                <Input
                  type="number"
                  value={lesson.exercise?.correctIndex ?? 0}
                  onChange={(e) =>
                    update({
                      exercise: {
                        ...lesson.exercise!,
                        correctIndex: Number(e.target.value),
                      },
                    })
                  }
                  min={0}
                />
              </div>
            </div>
          </details>
        </>
      )}

      {lesson.lessonType === "challenge" && (
        <div className="space-y-4">
          <LocaleTextarea
            value={lesson.challenge?.prompt ?? emptyLocaleText()}
            onChange={(prompt) =>
              update({
                challenge: {
                  prompt,
                  starterCode: lesson.challenge?.starterCode ?? "",
                  language: lesson.challenge?.language ?? "typescript",
                  testCases: lesson.challenge?.testCases ?? [],
                },
              })
            }
            label={t("challengePrompt")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("language")}</label>
              <select
                value={lesson.challenge?.language ?? "typescript"}
                onChange={(e) =>
                  update({
                    challenge: {
                      ...lesson.challenge!,
                      language: e.target.value as
                        | "rust"
                        | "typescript"
                        | "json",
                    },
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="typescript">TypeScript</option>
                <option value="rust">Rust</option>
                <option value="json">JSON</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("starterCode")}</label>
            <textarea
              value={lesson.challenge?.starterCode ?? ""}
              onChange={(e) =>
                update({
                  challenge: {
                    ...lesson.challenge!,
                    starterCode: e.target.value,
                  },
                })
              }
              rows={6}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("testCases")}</label>
            {(lesson.challenge?.testCases ?? []).map((tc, ti) => (
              <div key={ti} className="flex items-start gap-2">
                <Input
                  value={tc.input}
                  onChange={(e) => {
                    const newTcs = [...(lesson.challenge?.testCases ?? [])];
                    newTcs[ti] = { ...tc, input: e.target.value };
                    update({
                      challenge: { ...lesson.challenge!, testCases: newTcs },
                    });
                  }}
                  placeholder={t("input")}
                  className="flex-1"
                />
                <Input
                  value={tc.expected}
                  onChange={(e) => {
                    const newTcs = [...(lesson.challenge?.testCases ?? [])];
                    newTcs[ti] = { ...tc, expected: e.target.value };
                    update({
                      challenge: { ...lesson.challenge!, testCases: newTcs },
                    });
                  }}
                  placeholder={t("expected")}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newTcs = (lesson.challenge?.testCases ?? []).filter(
                      (_, i) => i !== ti,
                    );
                    update({
                      challenge: { ...lesson.challenge!, testCases: newTcs },
                    });
                  }}
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                update({
                  challenge: {
                    ...lesson.challenge!,
                    testCases: [
                      ...(lesson.challenge?.testCases ?? []),
                      { input: "", expected: "" },
                    ],
                  },
                })
              }
            >
              <Plus className="h-3 w-3 mr-1" />
              {t("addTestCase")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
