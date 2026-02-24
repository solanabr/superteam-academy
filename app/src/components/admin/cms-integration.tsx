"use client";

import { useState } from "react";
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
        message: "Failed to reach the server",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--c-text-2)]">
          Connect your Sanity CMS to manage and import course content. Courses
          from both Supabase (database) and Sanity (CMS) will be available.
        </p>
      </div>

      {/* Connection Form */}
      <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-[var(--c-text-2)]" />
          <h3 className="text-xs font-semibold text-[var(--c-text)]">
            Sanity CMS Connection
          </h3>
          <Badge className="text-[9px]">Optional</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-medium text-[var(--c-text-2)] mb-1">
              Project ID *
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
              Dataset
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
            API Token (for write access)
          </label>
          <Input
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="sk-..."
            className="h-8 text-xs font-mono"
          />
          <p className="text-[9px] text-[var(--c-text-dim)] mt-1">
            Get your token from{" "}
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
                    {status.courseCount} courses
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
                Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] p-4">
        <h3 className="text-xs font-semibold text-[var(--c-text)] mb-2">
          How CMS Integration Works
        </h3>
        <div className="space-y-2 text-[11px] text-[var(--c-text-2)]">
          <div className="flex items-start gap-2">
            <span className="text-[#00FFA3] font-mono shrink-0">1.</span>
            <span>
              <strong className="text-[var(--c-text)]">Database courses</strong>{" "}
              (Supabase) are managed directly from this admin panel — edit
              titles, descriptions, modules, and lessons.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#00FFA3] font-mono shrink-0">2.</span>
            <span>
              <strong className="text-[var(--c-text)]">CMS courses</strong>{" "}
              (Sanity) let content creators use Sanity Studio to author rich
              course content with their familiar tools.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#00FFA3] font-mono shrink-0">3.</span>
            <span>
              The platform merges both sources — Supabase courses appear first,
              then Sanity courses, with static fallback data as a safety net.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
