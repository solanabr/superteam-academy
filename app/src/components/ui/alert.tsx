"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type AlertProps = React.ComponentProps<"div"> & {
  variant?: "default" | "destructive";
};

function Alert({ className, variant = "default", ...props }: AlertProps): React.ReactElement {
  return (
    <div
      role="status"
      data-slot="alert"
      data-variant={variant}
      className={cn(
        "flex gap-2 border px-3 py-2 text-xs font-mono uppercase tracking-wide",
        variant === "destructive"
          ? "border-destructive text-destructive bg-destructive/5"
          : "border-border text-foreground bg-muted/40",
        className,
      )}
      {...props}
    />
  );
}

export { Alert };

