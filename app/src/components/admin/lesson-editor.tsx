"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  Save,
  Loader2,
  Eye,
  Code,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-64 rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] flex items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-[var(--c-text-2)]" />
    </div>
  ),
});

interface ChallengeData {
  instructions: string;
  starterCode: string;
  solution: string;
  language: string;
}

interface LessonData {
  _id: string;
  title: string;
  slug: string;
  type: string;
  xpReward: number;
  estimatedMinutes: number;
  order: number;
  markdownContent?: string;
  challenge?: ChallengeData;
}

interface TestCase {
  name: string;
  input: string;
  expectedOutput: string;
}

interface LessonEditorProps {
  lesson: LessonData;
  wallet?: string;
  onSave: () => void;
}

const LANGUAGE_OPTIONS = [
  { value: "rust", label: "Rust" },
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
];

const MONACO_LANG_MAP: Record<string, string> = {
  rust: "rust",
  typescript: "typescript",
  javascript: "javascript",
};

export function LessonEditor({ lesson, wallet, onSave }: LessonEditorProps) {
  const t = useTranslations("admin");
  const [title, setTitle] = useState(lesson.title);
  const [xpReward, setXpReward] = useState(lesson.xpReward);
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    lesson.estimatedMinutes,
  );
  const [markdownContent, setMarkdownContent] = useState(
    lesson.markdownContent ?? "",
  );
  const [showPreview, setShowPreview] = useState(false);

  // Challenge fields
  const [instructions, setInstructions] = useState(
    lesson.challenge?.instructions ?? "",
  );
  const [starterCode, setStarterCode] = useState(
    lesson.challenge?.starterCode ?? "",
  );
  const [solution, setSolution] = useState(lesson.challenge?.solution ?? "");
  const [language, setLanguage] = useState(
    lesson.challenge?.language ?? "typescript",
  );
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        wallet,
        title,
        xpReward,
        estimatedMinutes,
        markdownContent,
      };

      if (lesson.type === "challenge") {
        body.challenge = {
          instructions,
          starterCode,
          solution,
          language,
        };
      }

      const res = await fetch(`/api/admin/lessons/${lesson._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save");
      onSave();
    } catch {
      // Silent fail
    } finally {
      setSaving(false);
    }
  }, [
    wallet,
    lesson._id,
    lesson.type,
    title,
    xpReward,
    estimatedMinutes,
    markdownContent,
    instructions,
    starterCode,
    solution,
    language,
    onSave,
  ]);

  const addTestCase = () => {
    setTestCases([
      ...testCases,
      { name: "", input: "", expectedOutput: "" },
    ]);
  };

  const removeTestCase = (idx: number) => {
    setTestCases(testCases.filter((_, i) => i !== idx));
  };

  const updateTestCase = (
    idx: number,
    field: keyof TestCase,
    value: string,
  ) => {
    setTestCases(
      testCases.map((tc, i) => (i === idx ? { ...tc, [field]: value } : tc)),
    );
  };

  return (
    <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-4 space-y-4">
      {/* Basic Fields */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <label className="block text-[10px] font-medium text-[var(--c-text-2)] mb-1">
            {t("titleLabel")}
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-[var(--c-text-2)] mb-1">
            {t("xpRewardLabel")}
          </label>
          <Input
            type="number"
            value={xpReward}
            onChange={(e) => setXpReward(Number(e.target.value))}
            min={0}
            max={1000}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-[var(--c-text-2)] mb-1">
            {t("minutesLabel")}
          </label>
          <Input
            type="number"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            min={1}
            max={180}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Markdown Content */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] font-medium text-[var(--c-text-2)]">
            {t("contentMarkdown")}
          </label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1 text-[10px] text-[var(--c-text-2)] hover:text-[var(--c-text)] transition-colors cursor-pointer"
          >
            {showPreview ? (
              <>
                <Code className="h-3 w-3" /> {t("edit")}
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" /> {t("preview")}
              </>
            )}
          </button>
        </div>
        {showPreview ? (
          <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] p-4 min-h-[160px] prose prose-invert prose-sm max-w-none">
            <div
              className="text-sm text-[var(--c-text)] whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: markdownContent
                  .replace(/^### (.*$)/gm, '<h3 class="text-base font-semibold text-[var(--c-text)] mt-4 mb-2">$1</h3>')
                  .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold text-[var(--c-text)] mt-5 mb-2">$1</h2>')
                  .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold text-[var(--c-text)] mt-6 mb-3">$1</h1>')
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\*(.*?)\*/g, "<em>$1</em>")
                  .replace(
                    /`(.*?)`/g,
                    '<code class="text-[#00FFA3] bg-[var(--c-bg-elevated)] px-1 py-0.5 rounded text-xs">$1</code>',
                  )
                  .replace(/\n/g, "<br>"),
              }}
            />
          </div>
        ) : (
          <textarea
            value={markdownContent}
            onChange={(e) => setMarkdownContent(e.target.value)}
            placeholder={t("writeLessonContent")}
            rows={8}
            className="flex w-full rounded-[2px] bg-[var(--c-bg)] border border-[var(--c-border-subtle)] px-3 py-2 text-xs font-mono text-[var(--c-text)] placeholder:text-[var(--c-text-2)] transition-colors focus:outline-none focus:border-[#55E9AB] focus:ring-1 focus:ring-[#55E9AB] resize-y"
          />
        )}
      </div>

      {/* Challenge Fields */}
      {lesson.type === "challenge" && (
        <div className="space-y-4 border-t border-[var(--c-border-subtle)] pt-4">
          <h3 className="text-xs font-semibold text-[var(--c-text)] flex items-center gap-2">
            <Code className="h-3.5 w-3.5 text-[var(--c-text-2)]" />
            {t("challengeConfiguration")}
          </h3>

          {/* Language Selector */}
          <div>
            <label className="block text-[10px] font-medium text-[var(--c-text-2)] mb-1">
              {t("language")}
            </label>
            <div className="flex gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => setLanguage(lang.value)}
                  className={`px-3 py-1.5 text-[10px] font-mono rounded-[1px] border transition-all cursor-pointer ${
                    language === lang.value
                      ? "border-[#00FFA3] text-[#00FFA3] bg-[#00FFA3]/10"
                      : "border-[var(--c-border-subtle)] text-[var(--c-text-2)] hover:border-[var(--c-border-prominent)]"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-[10px] font-medium text-[var(--c-text-2)] mb-1">
              {t("instructionsLabel")}
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={t("instructionsPlaceholder")}
              rows={4}
              className="flex w-full rounded-[2px] bg-[var(--c-bg)] border border-[var(--c-border-subtle)] px-3 py-2 text-xs text-[var(--c-text)] placeholder:text-[var(--c-text-2)] transition-colors focus:outline-none focus:border-[#55E9AB] focus:ring-1 focus:ring-[#55E9AB] resize-y"
            />
          </div>

          {/* Starter Code */}
          <div>
            <label className="block text-[10px] font-medium text-[var(--c-text-2)] mb-1">
              {t("starterCode")}
            </label>
            <div className="rounded-[2px] border border-[var(--c-border-subtle)] overflow-hidden">
              <MonacoEditor
                height="200px"
                language={MONACO_LANG_MAP[language] ?? "typescript"}
                value={starterCode}
                onChange={(val) => setStarterCode(val ?? "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  padding: { top: 8 },
                  wordWrap: "on",
                }}
              />
            </div>
          </div>

          {/* Solution */}
          <div>
            <label className="block text-[10px] font-medium text-[var(--c-text-2)] mb-1">
              {t("solution")}
            </label>
            <div className="rounded-[2px] border border-[var(--c-border-subtle)] overflow-hidden">
              <MonacoEditor
                height="200px"
                language={MONACO_LANG_MAP[language] ?? "typescript"}
                value={solution}
                onChange={(val) => setSolution(val ?? "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  padding: { top: 8 },
                  wordWrap: "on",
                }}
              />
            </div>
          </div>

          {/* Test Cases */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-medium text-[var(--c-text-2)]">
                {t("testCases")} ({testCases.length})
              </label>
              <button
                type="button"
                onClick={addTestCase}
                className="flex items-center gap-1 text-[10px] text-[#00FFA3] hover:text-[#00FFA3]/80 transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" /> {t("addTestCase")}
              </button>
            </div>
            <div className="space-y-2">
              {testCases.map((tc, idx) => (
                <div
                  key={idx}
                  className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Input
                      value={tc.name}
                      onChange={(e) =>
                        updateTestCase(idx, "name", e.target.value)
                      }
                      placeholder={t("testNamePlaceholder")}
                      className="h-7 text-[10px] flex-1 mr-2"
                    />
                    <button
                      type="button"
                      onClick={() => removeTestCase(idx)}
                      className="p-1 rounded hover:bg-[#EF4444]/10 text-[var(--c-text-2)] hover:text-[#EF4444] transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-[var(--c-text-dim)] mb-0.5">
                        {t("input")}
                      </label>
                      <Input
                        value={tc.input}
                        onChange={(e) =>
                          updateTestCase(idx, "input", e.target.value)
                        }
                        className="h-7 text-[10px] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[var(--c-text-dim)] mb-0.5">
                        {t("expectedOutput")}
                      </label>
                      <Input
                        value={tc.expectedOutput}
                        onChange={(e) =>
                          updateTestCase(
                            idx,
                            "expectedOutput",
                            e.target.value,
                          )
                        }
                        className="h-7 text-[10px] font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-2 border-t border-[var(--c-border-subtle)]">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("savingLesson")}
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              {t("saveLesson")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
