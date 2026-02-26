import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        beginner: "border-transparent bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        intermediate: "border-transparent bg-blue-500/20 text-blue-400 border-blue-500/30",
        advanced: "border-transparent bg-orange-500/20 text-orange-400 border-orange-500/30",
        expert: "border-transparent bg-red-500/20 text-red-400 border-red-500/30",
        purple: "border-transparent bg-[#9945FF]/20 text-[#9945FF] border-[#9945FF]/30",
        green: "border-transparent bg-[#14F195]/20 text-[#14F195] border-[#14F195]/30",
        blue: "border-transparent bg-[#00C2FF]/20 text-[#00C2FF] border-[#00C2FF]/30",
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
