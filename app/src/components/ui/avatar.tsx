"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type AvatarProps = React.ComponentProps<"div">;

function Avatar({ className, children, ...props }: AvatarProps): React.ReactElement {
  return (
    <div
      data-slot="avatar"
      className={cn(
        "flex items-center justify-center bg-muted text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type AvatarFallbackProps = React.ComponentProps<"span">;

function AvatarFallback({ className, children, ...props }: AvatarFallbackProps): React.ReactElement {
  return (
    <span
      data-slot="avatar-fallback"
      className={cn("flex h-full w-full items-center justify-center text-xs font-medium", className)}
      {...props}
    >
      {children}
    </span>
  );
}

export { Avatar, AvatarFallback };

