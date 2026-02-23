import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[1px] px-2.5 py-1 text-[11px] font-mono font-medium uppercase tracking-widest",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--c-border-subtle)] text-[var(--c-text-2)] border border-[var(--c-border-subtle)]",
        outline:
          "border border-[var(--c-border-prominent)] text-[var(--c-text)] bg-[var(--c-bg)]/90 backdrop-blur",
        beginner: "bg-[#55E9AB]/10 text-[#55E9AB] border border-[#55E9AB]/20",
        intermediate:
          "bg-[#FFC526]/10 text-[#FFC526] border border-[#FFC526]/20",
        advanced: "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  );
}
