"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, Download, Trash2, AlertTriangle } from "lucide-react";
import { Toggle } from "./toggle";

const PRIVACY_STORAGE_KEY = "sta-privacy";

function DeleteAccountSection() {
  const t = useTranslations("settings");
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const router = useRouter();

  function handleDelete() {
    if (confirmText !== "DELETE") return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("sta")) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
      <p className="text-sm text-foreground">
        {t("accountSection.deleteWarning")}
      </p>
      {!showConfirm ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="mt-4 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90"
        >
          {t("accountSection.deleteAccount")}
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {t("accountSection.deleteConfirm")}
          </div>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full rounded-lg border border-destructive/30 bg-card px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-destructive focus:outline-none focus:ring-1 focus:ring-destructive"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={confirmText !== "DELETE"}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("accountSection.confirmDelete")}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowConfirm(false);
                setConfirmText("");
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              {t("accountSection.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PrivacyTab() {
  const t = useTranslations("settings");
  const [profilePublic, setProfilePublic] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const raw = localStorage.getItem(PRIVACY_STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.profilePublic === "boolean") return p.profilePublic;
      }
    } catch {
      /* ignore */
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Profile Visibility */}
      <div>
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">
            {t("privacySection.profileVisibility")}
          </h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("privacySection.visibilityDescription")}
        </p>
        <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              {profilePublic
                ? t("privacySection.profilePublic")
                : t("privacySection.profilePrivate")}
            </p>
            <p className="text-xs text-muted-foreground">
              {profilePublic
                ? t("privacySection.publicDescription")
                : t("privacySection.privateDescription")}
            </p>
          </div>
          <Toggle
            enabled={profilePublic}
            onToggle={() => {
              const next = !profilePublic;
              setProfilePublic(next);
              localStorage.setItem(
                PRIVACY_STORAGE_KEY,
                JSON.stringify({ profilePublic: next }),
              );
            }}
          />
        </div>
      </div>

      {/* Data Export */}
      <div>
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">
            {t("accountSection.exportData")}
          </h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("accountSection.exportDescription")}
        </p>
        <button
          type="button"
          onClick={() => {
            const data: Record<string, unknown> = {};
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key?.startsWith("sta")) {
                try {
                  data[key] = JSON.parse(localStorage.getItem(key)!);
                } catch {
                  data[key] = localStorage.getItem(key);
                }
              }
            }
            const blob = new Blob([JSON.stringify(data, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `superteam-academy-data-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Download className="h-4 w-4" />
          {t("accountSection.exportData")}
        </button>
      </div>

      {/* Account Deletion */}
      <div>
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-destructive" />
          <h3 className="text-lg font-semibold text-destructive">
            {t("accountSection.deleteAccount")}
          </h3>
        </div>
        <DeleteAccountSection />
      </div>
    </div>
  );
}
