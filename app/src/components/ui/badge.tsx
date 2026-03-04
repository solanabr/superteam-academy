import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        success:
          "border-transparent bg-success text-success-foreground shadow hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-warning-foreground shadow hover:bg-warning/80",
        outline: "text-foreground",
        // Track badges
        fundamentals: "border-transparent bg-[hsl(var(--track-fundamentals))] text-white",
        defi: "border-transparent bg-[hsl(var(--track-defi))] text-white",
        nft: "border-transparent bg-[hsl(var(--track-nft))] text-white",
        gaming: "border-transparent bg-[hsl(var(--track-gaming))] text-black",
        infrastructure: "border-transparent bg-[hsl(var(--track-infrastructure))] text-white",
        security: "border-transparent bg-[hsl(var(--track-security))] text-white",
        // Difficulty badges
        beginner: "border-transparent bg-green-500/20 text-green-500",
        intermediate: "border-transparent bg-yellow-500/20 text-yellow-500",
        advanced: "border-transparent bg-red-500/20 text-red-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
