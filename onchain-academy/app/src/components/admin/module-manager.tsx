"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  ArrowUp,
  ArrowDown,
  FileText,
  Code,
  Video,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LessonEditor } from "./lesson-editor";

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

interface ModuleManagerProps {
  courseId: string;
  modules: ModuleData[];
  wallet?: string;
  onUpdate: () => void;
}

const LESSON_TYPE_ICONS: Record<string, typeof FileText> = {
  reading: FileText,
  challenge: Code,
  video: Video,
  quiz: HelpCircle,
};

export function ModuleManager({
  courseId,
  modules,
  wallet,
  onUpdate,
}: ModuleManagerProps) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [expandedModule, setExpandedModule] = useState<string | null>(
    modules[0]?._id ?? null,
  );
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [addingModule, setAddingModule] = useState(false);
  const [addingLessonToModule, setAddingLessonToModule] = useState<
    string | null
  >(null);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonType, setNewLessonType] = useState("reading");
  const [loading, setLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const createModule = async () => {
    if (!newModuleTitle.trim()) return;
    setLoading("create-module");
    try {
      const res = await fetch("/api/admin/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet,
          courseId,
          title: newModuleTitle,
          description: "",
          order: modules.length,
        }),
      });
      if (!res.ok) throw new Error("Failed to create module");
      setNewModuleTitle("");
      setAddingModule(false);
      onUpdate();
    } catch (error) {
      console.error("[ModuleManager] Failed to create module:", error);
    } finally {
      setLoading(null);
    }
  };

  const deleteModule = async (moduleId: string) => {
    setLoading(`delete-${moduleId}`);
    try {
      const res = await fetch(
        `/api/admin/modules/${moduleId}?wallet=${wallet}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to delete module");
      setDeleteConfirm(null);
      onUpdate();
    } catch (error) {
      console.error("[ModuleManager] Failed to delete module:", error);
    } finally {
      setLoading(null);
    }
  };

  const reorderModule = async (moduleId: string, direction: "up" | "down") => {
    const idx = modules.findIndex((m) => m._id === moduleId);
    if (
      (direction === "up" && idx === 0) ||
      (direction === "down" && idx === modules.length - 1)
    )
      return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    setLoading(`reorder-${moduleId}`);
    try {
      await Promise.all([
        fetch(`/api/admin/modules/${modules[idx]._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet, order: swapIdx }),
        }),
        fetch(`/api/admin/modules/${modules[swapIdx]._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet, order: idx }),
        }),
      ]);
      onUpdate();
    } catch (error) {
      console.error("[ModuleManager] Failed to reorder module:", error);
    } finally {
      setLoading(null);
    }
  };

  const createLesson = async (moduleId: string) => {
    if (!newLessonTitle.trim()) return;
    setLoading(`create-lesson-${moduleId}`);
    try {
      const mod = modules.find((m) => m._id === moduleId);
      const res = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet,
          moduleId,
          title: newLessonTitle,
          type: newLessonType,
          order: mod?.lessons?.length ?? 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to create lesson");
      setNewLessonTitle("");
      setAddingLessonToModule(null);
      onUpdate();
    } catch (error) {
      console.error("[ModuleManager] Failed to create lesson:", error);
    } finally {
      setLoading(null);
    }
  };

  const deleteLesson = async (lessonId: string) => {
    setLoading(`delete-lesson-${lessonId}`);
    try {
      const res = await fetch(
        `/api/admin/lessons/${lessonId}?wallet=${wallet}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to delete lesson");
      setDeleteConfirm(null);
      onUpdate();
    } catch (error) {
      console.error("[ModuleManager] Failed to delete lesson:", error);
    } finally {
      setLoading(null);
    }
  };

  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--c-text)]">
          {t("modulesCount", { count: modules.length })}
        </h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAddingModule(true)}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" /> {t("addModule")}
        </Button>
      </div>

      {/* Add Module Form */}
      {addingModule && (
        <div className="rounded-[2px] border border-[#00FFA3]/20 bg-[#00FFA3]/5 p-4 space-y-3">
          <Input
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            placeholder={t("moduleTitlePlaceholder")}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") createModule();
              if (e.key === "Escape") setAddingModule(false);
            }}
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAddingModule(false);
                setNewModuleTitle("");
              }}
            >
              {tc("cancel")}
            </Button>
            <Button
              size="sm"
              onClick={createModule}
              disabled={!newModuleTitle.trim() || loading === "create-module"}
            >
              {loading === "create-module" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                t("createModule")
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Module List */}
      {sortedModules.length === 0 && !addingModule && (
        <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-8 text-center">
          <p className="text-sm text-[var(--c-text-2)]">
            {t("noModulesYet")}
          </p>
        </div>
      )}

      {sortedModules.map((mod, modIdx) => (
        <div
          key={mod._id}
          className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] overflow-hidden"
        >
          {/* Module Header */}
          <div className="flex items-center justify-between p-4 hover:bg-[var(--c-bg-elevated)]/30 transition-colors">
            <button
              onClick={() =>
                setExpandedModule(
                  expandedModule === mod._id ? null : mod._id,
                )
              }
              className="flex items-center gap-3 flex-1 text-left cursor-pointer"
            >
              <GripVertical className="h-4 w-4 text-[var(--c-text-dim)]" />
              <span className="text-xs font-mono text-[#00FFA3]">
                {modIdx + 1}
              </span>
              <div>
                <h3 className="text-sm font-medium text-[var(--c-text)]">
                  {mod.title}
                </h3>
                <p className="text-[10px] text-[var(--c-text-2)]">
                  {(mod.lessons?.length ?? 0) === 1
                    ? t("lessonCount", { count: mod.lessons?.length ?? 0 })
                    : t("lessonCountPlural", { count: mod.lessons?.length ?? 0 })}
                </p>
              </div>
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => reorderModule(mod._id, "up")}
                disabled={modIdx === 0}
                className="p-1.5 rounded hover:bg-[var(--c-border-subtle)] text-[var(--c-text-2)] hover:text-[var(--c-text)] transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                aria-label={t("moveModuleUp")}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => reorderModule(mod._id, "down")}
                disabled={modIdx === sortedModules.length - 1}
                className="p-1.5 rounded hover:bg-[var(--c-border-subtle)] text-[var(--c-text-2)] hover:text-[var(--c-text)] transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                aria-label={t("moveModuleDown")}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              {deleteConfirm === mod._id ? (
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteModule(mod._id)}
                    disabled={loading === `delete-${mod._id}`}
                    className="text-[10px] h-6 px-2"
                  >
                    {loading === `delete-${mod._id}` ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      t("confirm")
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteConfirm(null)}
                    className="text-[10px] h-6 px-2"
                  >
                    {tc("cancel")}
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(mod._id)}
                  className="p-1.5 rounded hover:bg-[#EF4444]/10 text-[var(--c-text-2)] hover:text-[#EF4444] transition-colors cursor-pointer ml-1"
                  aria-label={t("deleteModule")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() =>
                  setExpandedModule(
                    expandedModule === mod._id ? null : mod._id,
                  )
                }
                className="p-1.5 rounded hover:bg-[var(--c-border-subtle)] text-[var(--c-text-2)] transition-colors ml-1 cursor-pointer"
              >
                {expandedModule === mod._id ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Expanded: Lessons */}
          {expandedModule === mod._id && (
            <div className="border-t border-[var(--c-border-subtle)] px-4 pb-4">
              <div className="space-y-2 mt-3">
                {(mod.lessons ?? [])
                  .sort((a, b) => a.order - b.order)
                  .map((lesson, lessonIdx) => {
                    const Icon =
                      LESSON_TYPE_ICONS[lesson.type] ?? FileText;
                    return (
                      <div key={lesson._id}>
                        <div
                          className={`flex items-center justify-between rounded-[2px] border px-3 py-2.5 transition-colors ${
                            editingLesson === lesson._id
                              ? "border-[#00FFA3]/30 bg-[#00FFA3]/5"
                              : "border-[var(--c-border-subtle)] bg-[var(--c-bg)] hover:bg-[var(--c-bg-elevated)]/30"
                          }`}
                        >
                          <button
                            onClick={() =>
                              setEditingLesson(
                                editingLesson === lesson._id
                                  ? null
                                  : lesson._id,
                              )
                            }
                            className="flex items-center gap-3 flex-1 text-left cursor-pointer"
                          >
                            <Icon className="h-3.5 w-3.5 text-[var(--c-text-2)]" />
                            <span className="text-sm text-[var(--c-text)]">
                              {lesson.title}
                            </span>
                            <Badge className="text-[9px] ml-1">
                              {lesson.type}
                            </Badge>
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-[#00FFA3]">
                              {lesson.xpReward} XP
                            </span>
                            {deleteConfirm === lesson._id ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteLesson(lesson._id)}
                                  disabled={
                                    loading ===
                                    `delete-lesson-${lesson._id}`
                                  }
                                  className="text-[10px] h-6 px-2"
                                >
                                  {loading ===
                                  `delete-lesson-${lesson._id}` ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    t("delete")
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDeleteConfirm(null)}
                                  className="text-[10px] h-6 px-2"
                                >
                                  {t("no")}
                                </Button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(lesson._id)}
                                className="p-1 rounded hover:bg-[#EF4444]/10 text-[var(--c-text-2)] hover:text-[#EF4444] transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Lesson Editor (inline) */}
                        {editingLesson === lesson._id && (
                          <div className="mt-2 ml-6">
                            <LessonEditor
                              lesson={lesson}
                              wallet={wallet}
                              onSave={() => {
                                setEditingLesson(null);
                                onUpdate();
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Add Lesson */}
              {addingLessonToModule === mod._id ? (
                <div className="mt-3 rounded-[2px] border border-[#00FFA3]/20 bg-[#00FFA3]/5 p-3 space-y-3">
                  <Input
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    placeholder={t("lessonTitlePlaceholder")}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") createLesson(mod._id);
                      if (e.key === "Escape") {
                        setAddingLessonToModule(null);
                        setNewLessonTitle("");
                      }
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--c-text-2)]">
                      {t("type")}
                    </label>
                    {["reading", "video", "challenge", "quiz"].map((lt) => (
                      <button
                        key={lt}
                        type="button"
                        onClick={() => setNewLessonType(lt)}
                        className={`px-2 py-1 text-[10px] rounded-[1px] border transition-all cursor-pointer ${
                          newLessonType === lt
                            ? "border-[#00FFA3] text-[#00FFA3] bg-[#00FFA3]/10"
                            : "border-[var(--c-border-subtle)] text-[var(--c-text-2)]"
                        }`}
                      >
                        {lt}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAddingLessonToModule(null);
                        setNewLessonTitle("");
                      }}
                    >
                      {tc("cancel")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => createLesson(mod._id)}
                      disabled={
                        !newLessonTitle.trim() ||
                        loading === `create-lesson-${mod._id}`
                      }
                    >
                      {loading === `create-lesson-${mod._id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        t("addLesson")
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingLessonToModule(mod._id)}
                  className="mt-3 flex items-center gap-2 w-full rounded-[2px] border border-dashed border-[var(--c-border-subtle)] px-3 py-2.5 text-xs text-[var(--c-text-2)] hover:border-[#00FFA3]/40 hover:text-[#00FFA3] transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("addLesson")}
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
