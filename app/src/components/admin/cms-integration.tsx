"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ConnectionStatus {
  connected: boolean;
  message: string;
  courseCount?: number;
}

export function CmsIntegration() {
  const t = useTranslations("admin");
  const [projectId, setProjectId] = useState("");
  const [dataset, setDataset] = useState("production");
  const [apiToken, setApiToken] = useState("");
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);

  const testConnection = async () => {
    if (!projectId.trim()) return;

    setTesting(true);
    setStatus(null);

    try {
      const res = await fetch("/api/admin/cms/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: projectId.trim(),
          dataset: dataset.trim() || "production",
          apiToken: apiToken.trim() || undefined,
        }),
      });

      const data = await res.json();
      setStatus({
        connected: data.connected ?? false,
        message: data.message ?? "Unknown error",
        courseCount: data.courseCount,
      });
    } catch {
      setStatus({
        connected: false,
        message: t("failedToReachServer"),
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--c-text-2)]">
          {t("cmsDescription")}
        </p>
      </div>

      {/* Connection Form */}
      <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-[var(--c-text-2)]" />
          <h3 className="text-xs font-semibold text-[var(--c-text)]">
            {t("sanityCmsConnection")}
          </h3>
          <Badge className="text-[9px]">{t("optional")}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-medium text-[var(--c-text-2)] mb-1">
              {t("projectIdRequired")}
            </label>
            <Input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="e.g., abc123xyz"
              className="h-8 text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-[var(--c-text-2)] mb-1">
              {t("dataset")}
            </label>
            <Input
              value={dataset}
              onChange={(e) => setDataset(e.target.value)}
              placeholder="production"
              className="h-8 text-xs font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-medium text-[var(--c-text-2)] mb-1">
            {t("apiTokenLabel")}
          </label>
          <Input
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="sk-..."
            className="h-8 text-xs font-mono"
          />
          <p className="text-[9px] text-[var(--c-text-dim)] mt-1">
            {t("getToken")}{" "}
            <a
              href="https://www.sanity.io/manage"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00FFA3] hover:underline inline-flex items-center gap-0.5"
            >
              sanity.io/manage
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            {status && (
              <div
                className={`flex items-center gap-2 text-xs ${
                  status.connected ? "text-[#00FFA3]" : "text-[#EF4444]"
                }`}
              >
                {status.connected ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                <span>{status.message}</span>
                {status.courseCount !== undefined && (
                  <Badge className="text-[9px] ml-1">
                    {t("coursesCountBadge", { count: status.courseCount })}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={testConnection}
            disabled={testing || !projectId.trim()}
            className="gap-1.5"
          >
            {testing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("testing")}
              </>
            ) : (
              t("testConnection")
            )}
          </Button>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] p-4">
        <h3 className="text-xs font-semibold text-[var(--c-text)] mb-2">
          {t("howCmsWorks")}
        </h3>
        <div className="space-y-2 text-[11px] text-[var(--c-text-2)]">
          <div className="flex items-start gap-2">
            <span className="text-[#00FFA3] font-mono shrink-0">1.</span>
            <span>
              <strong className="text-[var(--c-text)]">{t("cmsStep1Title")}</strong>{" "}
              {t("cmsStep1Desc")}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#00FFA3] font-mono shrink-0">2.</span>
            <span>
              <strong className="text-[var(--c-text)]">{t("cmsStep2Title")}</strong>{" "}
              {t("cmsStep2Desc")}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#00FFA3] font-mono shrink-0">3.</span>
            <span>
              {t("cmsStep3Desc")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
