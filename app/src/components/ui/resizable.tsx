// app/src/components/ui/resizable.tsx
"use client";

import * as React from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

import { cn } from "@/lib/utils";

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof Group>) => (
  <Group
    className={cn("flex h-full w-full", className)}
    {...props}
  />
);

const ResizablePanel = ({
  className,
  ...props
}: React.ComponentProps<typeof Panel>) => (
  <Panel className={cn(className)} {...props} />
);

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean;
}) => (
  <Separator
    className={cn(
      "bg-border hover:bg-border/80 active:bg-border/90 transition-colors",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-1 rounded-full bg-border/50" />
    )}
  </Separator>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };