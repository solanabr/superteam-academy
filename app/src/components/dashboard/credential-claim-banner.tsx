"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CredentialModal, type CredentialModalData } from "@/components/credential-modal";
import { X, Loader2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CollectableEnrollment {
  courseId: string;
  title: string;
}

export function CredentialClaimBanner({ courses }: { courses: CollectableEnrollment[] }) {
  const t = useTranslations("dashboard");
  const [dismissed, setDismissed] = useState(false);
  const [collectedIds, setCollectedIds] = useState<Set<string>>(new Set());
  const [collectingId, setCollectingId] = useState<string | null>(null);
  const [credentialModal, setCredentialModal] = useState<CredentialModalData | null>(null);

  const visible = courses.filter((c) => !collectedIds.has(c.courseId));

  if (dismissed || visible.length === 0) return null;

  async function handleCollect(courseId: string) {
    setCollectingId(courseId);
    try {
      const res = await fetch("/api/credentials/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Credential collection failed");
      }
      const data = await res.json();
      setCollectedIds((prev) => new Set([...prev, courseId]));
      setCredentialModal({
        credentialAsset: data.credentialAsset,
        signature: data.signature,
        trackName: data.trackName,
        level: data.level,
        coursesCompleted: data.coursesCompleted,
        totalXp: data.totalXp,
        isUpgrade: data.isUpgrade,
        imageUrl: data.imageUrl,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to collect credential";
      toast.error(message);
    } finally {
      setCollectingId(null);
    }
  }

  return (
    <>
      <div className="mb-6">
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t("collectCredentialNfts")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("collectCredentialDescription")}
                </p>
                <div className="mt-3 space-y-2">
                  {visible.map((c) => (
                    <div
                      key={c.courseId}
                      className="flex items-center justify-between gap-4 rounded-md bg-background/60 px-3 py-2"
                    >
                      <span className="truncate text-sm">{c.title}</span>
                      <Button
                        size="sm"
                        className="h-7 shrink-0 gap-1 text-xs"
                        disabled={collectingId === c.courseId}
                        onClick={() => handleCollect(c.courseId)}
                      >
                        {collectingId === c.courseId ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            {t("collecting")}
                          </>
                        ) : (
                          <>
                            <GraduationCap className="h-3 w-3" />
                            {t("collectCredential")}
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <CredentialModal
        open={!!credentialModal}
        onClose={() => setCredentialModal(null)}
        data={credentialModal}
      />
    </>
  );
}
