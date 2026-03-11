"use client";

import { useState } from "react";

interface DiffEntry {
  field: string;
  sanityValue: unknown;
  onChainValue: unknown;
  updateable: boolean;
}

interface SyncDiffViewProps {
  differences: DiffEntry[];
  title: string;
}

export function SyncDiffView({ differences, title }: SyncDiffViewProps) {
  const [expanded, setExpanded] = useState(false);

  if (differences.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-text-3 transition-colors hover:text-text"
      >
        <span>{expanded ? "▼" : "▶"}</span>
        {title} — {differences.length} difference
        {differences.length !== 1 ? "s" : ""}
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5 border-l border-border pl-3">
          {differences.map((d) => (
            <div key={d.field} className="font-mono text-xs">
              <span className="text-text-3">{d.field}</span>{" "}
              <span className="text-text-3">on-chain:</span>{" "}
              <span className="text-danger">{String(d.onChainValue)}</span>
              {"  "}
              <span className="text-text-3">sanity:</span>{" "}
              <span className="text-success">{String(d.sanityValue)}</span>{" "}
              {d.updateable ? (
                <span className="text-text-3">[updateable]</span>
              ) : (
                <span className="font-semibold text-danger">[immutable]</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
