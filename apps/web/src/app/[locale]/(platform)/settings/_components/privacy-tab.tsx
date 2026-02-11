"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────
interface PrivacyTabProps {
  isPublic: boolean;
  onPublicChange: (value: boolean) => void;
}

export function PrivacyTab({ isPublic, onPublicChange }: PrivacyTabProps) {
  const t = useTranslations("settings");

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ── Privacy toggle (optimistic) ───────────────────────────────
  const handleToggleVisibility = async () => {
    const previousValue = isPublic;
    onPublicChange(!isPublic); // Optimistic update
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        onPublicChange(previousValue); // Rollback
        return;
      }
      const { error } = await supabase
        .from("profiles")
        .update({ is_public: !previousValue })
        .eq("id", user.id);
      if (error) {
        onPublicChange(previousValue); // Rollback on failure
        console.error("[Settings] Privacy toggle failed:", error.message);
      }
    } catch {
      onPublicChange(previousValue); // Rollback on exception
    }
  };

  // ── Data export ───────────────────────────────────────────────
  const handleExportData = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const uid = user.id;
      const [profileRes, progressRes, achievementsRes, certsRes] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", uid).single(),
          supabase.from("user_progress").select("*").eq("user_id", uid),
          supabase.from("user_achievements").select("*").eq("user_id", uid),
          supabase.from("certificates").select("*").eq("user_id", uid),
        ]);

      // Check for errors on each query
      if (profileRes.error) {
        console.error(
          "[Settings] Export failed (profiles):",
          profileRes.error.message
        );
        setMessage({ type: "error", text: t("exportFailed") });
        return;
      }
      if (progressRes.error) {
        console.error(
          "[Settings] Export failed (progress):",
          progressRes.error.message
        );
        setMessage({ type: "error", text: t("exportFailed") });
        return;
      }
      if (achievementsRes.error) {
        console.error(
          "[Settings] Export failed (achievements):",
          achievementsRes.error.message
        );
        setMessage({ type: "error", text: t("exportFailed") });
        return;
      }
      if (certsRes.error) {
        console.error(
          "[Settings] Export failed (certificates):",
          certsRes.error.message
        );
        setMessage({ type: "error", text: t("exportFailed") });
        return;
      }

      const exportData = {
        exportedAt: new Date().toISOString(),
        profile: profileRes.data,
        progress: progressRes.data,
        achievements: achievementsRes.data,
        certificates: certsRes.data,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "superteam-lms-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      console.error("[Settings] Export failed unexpectedly");
      setMessage({ type: "error", text: t("exportFailed") });
    }
  };

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{t("profileVisibility")}</p>
            <p className="text-sm text-text-3">{t("profilePublic")}</p>
          </div>
          <button
            onClick={handleToggleVisibility}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              isPublic ? "bg-primary" : "bg-subtle"
            }`}
            role="switch"
            aria-checked={isPublic}
            aria-label={t("profileVisibility")}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                isPublic ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="border-t border-border pt-4">
          <Button variant="outline" onClick={handleExportData}>
            {t("exportData")}
          </Button>
          {message && (
            <p
              className={`mt-2 text-sm ${
                message.type === "success" ? "text-success" : "text-danger"
              }`}
            >
              {message.text}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
