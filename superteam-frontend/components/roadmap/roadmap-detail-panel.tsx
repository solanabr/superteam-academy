"use client";

import { X, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ResourceLink } from "@/lib/roadmaps/types";

type NodeData = {
  label: string;
  variant: string;
  description?: string;
  resources?: ResourceLink[];
};

const typeBadgeClass: Record<string, string> = {
  course: "bg-primary/20 text-primary border-primary/30",
  article: "bg-accent/20 text-accent-foreground border-accent/30",
  docs: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  video: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export function RoadmapDetailPanel({
  data,
  onClose,
}: {
  data: NodeData;
  onClose: () => void;
}) {
  return (
    <div className="h-full w-full border-l border-border bg-background/95 backdrop-blur-sm flex flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="text-lg font-bold leading-tight">{data.label}</h2>
        <button
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {data.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {data.description}
          </p>
        )}

        {data.resources && data.resources.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Free Resources</h3>
            <ul className="space-y-2">
              {data.resources.map((r) => (
                <li key={r.url}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-secondary transition-colors group"
                  >
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[10px] uppercase tracking-wide ${typeBadgeClass[r.type] ?? ""}`}
                    >
                      {r.type}
                    </Badge>
                    <span className="flex-1 group-hover:text-primary transition-colors">
                      {r.title}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(!data.resources || data.resources.length === 0) &&
          !data.description && (
            <p className="text-sm text-muted-foreground italic">
              Resources coming soon.
            </p>
          )}
      </div>
    </div>
  );
}
