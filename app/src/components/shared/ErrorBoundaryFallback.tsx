"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onReset?: () => void;
}

export function ErrorBoundaryFallback({ onReset }: Props) {
  // Hardcoded to prevent infinite error loop if i18n context is broken
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 text-center px-4">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold">Something went wrong</p>
        <p className="text-sm text-muted-foreground">An unexpected error occurred. Please try again.</p>
      </div>
      {onReset && (
        <Button variant="outline" size="sm" onClick={onReset}>
          Try Again
        </Button>
      )}
    </div>
  );
}
