"use client";

import { useState, useMemo } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Globe,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModuleData {
  _id: string;
  title: string;
  description: string;
  order: number;
  lessons: {
    _id: string;
    title: string;
    type: string;
  }[];
}

interface PublishDialogProps {
  courseId: string;
  title: string;
  description: string;
  modules: ModuleData[];
  published: boolean;
  onClose: () => void;
  onPublished: () => void;
}

interface CheckItem {
  label: string;
  passed: boolean;
  critical: boolean;
}

export function PublishDialog({
  courseId,
  title,
  description,
  modules,
  published,
  onClose,
  onPublished,
}: PublishDialogProps) {
  const [publishing, setPublishing] = useState(false);
  const [registerOnChain, setRegisterOnChain] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalLessons = modules.reduce(
    (sum, m) => sum + (m.lessons?.length ?? 0),
    0,
  );

  const checks: CheckItem[] = useMemo(
    () => [
      {
        label: "Course has a title",
        passed: Boolean(title && title.trim().length > 0),
        critical: true,
      },
      {
        label: "Course has a description",
        passed: Boolean(description && description.trim().length > 0),
        critical: true,
      },
      {
        label: "At least 1 module",
        passed: modules.length > 0,
        critical: true,
      },
      {
        label: "At least 1 lesson",
        passed: totalLessons > 0,
        critical: true,
      },
      {
        label: "All modules have titles",
        passed: modules.every((m) => m.title && m.title.trim().length > 0),
        critical: false,
      },
      {
        label: "All lessons have titles",
        passed: modules.every((m) =>
          (m.lessons ?? []).every(
            (l) => l.title && l.title.trim().length > 0,
          ),
        ),
        critical: false,
      },
    ],
    [title, description, modules, totalLessons],
  );

  const criticalsPassed = checks.filter((c) => c.critical).every((c) => c.passed);
  const allPassed = checks.every((c) => c.passed);

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    try {
      // Toggle publish in Sanity
      const res = await fetch(`/api/admin/courses/${courseId}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          published: !published,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data.details?.join(". ") || data.error || "Publish failed",
        );
      }

      // Optionally register on-chain
      if (registerOnChain && !published) {
        const onchainRes = await fetch(
          `/api/admin/courses/${courseId}/register-onchain`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          },
        );
        const onchainData = await onchainRes.json();
        if (!onchainRes.ok && !onchainData.alreadyDone) {
          // Non-blocking: course is published even if on-chain registration fails
          console.warn("On-chain registration failed:", onchainData.error);
        }
      }

      onPublished();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--c-border-subtle)]">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-[var(--c-text-2)]" />
            <h2 className="text-sm font-semibold text-[var(--c-text)]">
              {published ? "Unpublish Course" : "Publish Course"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[var(--c-border-subtle)] text-[var(--c-text-2)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {published ? (
            <p className="text-sm text-[var(--c-text-2)]">
              This will remove the course from the public catalog. Existing
              enrollments will not be affected.
            </p>
          ) : (
            <>
              {/* Checklist */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--c-text-2)] uppercase tracking-wider">
                  Pre-publish Checklist
                </label>
                {checks.map((check, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] px-3 py-2"
                  >
                    {check.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-[#55E9AB] shrink-0" />
                    ) : (
                      <AlertTriangle
                        className={`h-4 w-4 shrink-0 ${check.critical ? "text-[#EF4444]" : "text-amber-400"}`}
                      />
                    )}
                    <span
                      className={`text-xs ${check.passed ? "text-[var(--c-text)]" : check.critical ? "text-[#EF4444]" : "text-amber-400"}`}
                    >
                      {check.label}
                    </span>
                    {check.critical && !check.passed && (
                      <span className="ml-auto text-[9px] font-mono text-[#EF4444] uppercase">
                        Required
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Register on-chain checkbox */}
              <label className="flex items-center gap-2.5 rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] px-3 py-2.5 cursor-pointer hover:bg-[var(--c-bg-elevated)]/30 transition-colors">
                <input
                  type="checkbox"
                  checked={registerOnChain}
                  onChange={(e) => setRegisterOnChain(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--c-border-subtle)] text-[#00FFA3] focus:ring-[#00FFA3] bg-[var(--c-bg)] cursor-pointer"
                />
                <div>
                  <span className="text-xs text-[var(--c-text)]">
                    Also register on-chain
                  </span>
                  <p className="text-[10px] text-[var(--c-text-dim)]">
                    Creates Course PDA via create_course instruction
                  </p>
                </div>
                <LinkIcon className="h-3.5 w-3.5 text-[var(--c-text-dim)] ml-auto" />
              </label>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-[2px] border border-[#EF4444]/20 bg-[#EF4444]/5 px-3 py-2">
              <p className="text-[10px] text-[#EF4444]">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-[var(--c-border-subtle)]">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant={published ? "destructive" : "default"}
            onClick={handlePublish}
            disabled={
              publishing || (!published && !criticalsPassed)
            }
          >
            {publishing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {published ? "Unpublishing..." : "Publishing..."}
              </>
            ) : published ? (
              "Unpublish"
            ) : (
              "Publish Course"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
