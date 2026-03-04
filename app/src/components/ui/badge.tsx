"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badge_variants = cva(
  "inline-flex items-center border px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-primary",
        outline: "bg-background text-foreground border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof badge_variants>;

function Badge({ className, variant, ...props }: BadgeProps): React.ReactElement {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(badge_variants({ variant, className }))}
      {...props}
    />
  );
}

export { Badge, badge_variants as badgeVariants };

