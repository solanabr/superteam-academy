"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ScrollAreaProps = React.ComponentProps<"div">;

function ScrollArea({ className, children, ...props }: ScrollAreaProps): React.ReactElement {
  return (
    <div
      data-slot="scroll-area"
      className={cn("relative overflow-auto", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { ScrollArea };

