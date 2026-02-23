import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[2px] text-sm font-medium transition-all duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--c-bg)] disabled:pointer-events-none disabled:opacity-50 disabled:saturate-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#00FFA3] text-[#000000] hover:bg-[#00FFA3]/90 hover:shadow-[0_0_20px_-4px_rgba(0,255,163,0.3)]",
        secondary:
          "bg-[var(--c-border-subtle)] text-[var(--c-text)] hover:bg-[var(--c-border-prominent)]",
        outline:
          "border border-[var(--c-border-subtle)] bg-transparent text-[var(--c-text)] hover:bg-[var(--c-border-subtle)] hover:border-[var(--c-border-prominent)] hover:text-[var(--c-text)]",
        ghost:
          "text-[var(--c-text-2)] hover:bg-[var(--c-border-subtle)] hover:text-[var(--c-text)]",
        destructive:
          "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 hover:bg-[#EF4444]/20",
        link: "text-[#00FFA3] underline-offset-4 hover:underline",
        retro:
          "bg-[#00FFA3] text-[#000000] font-semibold shadow-[4px_4px_0px_0px_rgba(3,225,255,1)] hover:shadow-[2px_2px_0px_0px_rgba(3,225,255,1)] hover:translate-x-[2px] hover:translate-y-[2px]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-5 py-2",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
