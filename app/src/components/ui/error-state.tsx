"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { Button } from "./button";

interface ErrorStateProps {
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  details,
  onRetry,
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center w-full py-24 text-center px-4">
      <AlertTriangle className="w-16 h-16 text-[#EF4444]/80 mb-6" />
      <h3 className="text-2xl font-semibold text-[var(--c-text)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--c-text-2)] max-w-md mx-auto mb-6">
        {message}
      </p>
      <div className="flex gap-3">
        {onRetry && <Button onClick={onRetry}>Try Again</Button>}
        {details && (
          <Button
            variant="outline"
            onClick={() => setShowDetails(!showDetails)}
            className="gap-1"
          >
            Details{" "}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showDetails ? "rotate-180" : ""}`}
            />
          </Button>
        )}
      </div>
      {details && showDetails && (
        <pre className="mt-4 p-4 rounded bg-[var(--c-bg)] border border-[#EF4444]/20 text-[#EF4444] font-mono text-xs max-w-lg overflow-x-auto text-left">
          {details}
        </pre>
      )}
    </div>
  );
}
