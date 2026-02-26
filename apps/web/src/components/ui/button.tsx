import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   Superteam Academy v9 Button — 3 core variants: primary, secondary, accent
   Spec: docs/design-system.html (lines 278-310)
   ═══════════════════════════════════════════════════════════════ */

const buttonVariants = cva(
  /* Base — matches .btn in design-system.html */
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-display font-extrabold border-none cursor-pointer no-underline transition-all duration-[120ms] ease rounded-md text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 active:translate-y-[2px]",
  {
    variants: {
      variant: {
        /**
         * Primary — teal CTA with push shadow.
         * bg: var(--primary), color: #fff
         * box-shadow: 0 4px 0 0 var(--primary-dark)
         */
        primary:
          "bg-primary text-white shadow-[0_4px_0_0_var(--primary-dark)] hover:bg-primary-hover active:shadow-[0_1px_0_0_var(--primary-dark)]",

        /**
         * Secondary — transparent with strong border.
         * bg: transparent, color: var(--text)
         * border: 1.5px solid var(--border-strong)
         * Hover: border-color var(--primary), color var(--primary)
         */
        secondary:
          "bg-transparent text-text border-solid border-[1.5px] border-border-strong hover:border-primary hover:text-primary active:shadow-none",

        /**
         * Accent — XP amber with push shadow.
         * bg: var(--xp), color: #fff
         * box-shadow: 0 4px 0 0 var(--xp-dark)
         */
        accent:
          "bg-xp text-white shadow-[0_4px_0_0_var(--xp-dark)] hover:opacity-[0.92] active:shadow-[0_1px_0_0_var(--xp-dark)]",

        /* ── Utility variants (not in the 3-variant spec, kept for compat) ── */

        /** Ghost — no border, no shadow, subtle hover */
        ghost:
          "bg-transparent text-text-2 shadow-none hover:bg-subtle hover:text-text active:translate-y-0",

        /** Link style — inline text link */
        link: "text-primary underline-offset-4 hover:underline shadow-none active:translate-y-0",

        /* ── Backward-compat aliases for pre-v9 variant names ── */

        /** Push — alias for primary */
        push: "bg-primary text-white shadow-[0_4px_0_0_var(--primary-dark)] hover:bg-primary-hover active:shadow-[0_1px_0_0_var(--primary-dark)]",

        /** pushSuccess — alias for primary */
        pushSuccess:
          "bg-primary text-white shadow-[0_4px_0_0_var(--primary-dark)] hover:bg-primary-hover active:shadow-[0_1px_0_0_var(--primary-dark)]",

        /** outline / pushOutline — alias for secondary */
        outline:
          "bg-transparent text-text border-solid border-[1.5px] border-border-strong hover:border-primary hover:text-primary active:shadow-none",
        pushOutline:
          "bg-transparent text-text border-solid border-[1.5px] border-border-strong hover:border-primary hover:text-primary active:shadow-none",

        /** default — alias for primary */
        default:
          "bg-primary text-white shadow-[0_4px_0_0_var(--primary-dark)] hover:bg-primary-hover active:shadow-[0_1px_0_0_var(--primary-dark)]",

        /** pushAccent — alias for accent */
        pushAccent:
          "bg-xp text-white shadow-[0_4px_0_0_var(--xp-dark)] hover:opacity-[0.92] active:shadow-[0_1px_0_0_var(--xp-dark)]",

        /** destructive — danger red */
        destructive:
          "bg-danger text-white shadow-[0_4px_0_0_var(--danger-dark)] hover:opacity-[0.92] active:shadow-[0_1px_0_0_var(--danger-dark)]",
      },
      size: {
        /** Default: padding 11px 22px, font-size 14px */
        default: "px-[22px] py-[11px] text-sm",
        /** Small: padding 7px 14px, font-size 12px, border-radius var(--r-sm) */
        sm: "px-[14px] py-[7px] text-xs rounded-sm",
        /** Large: padding 14px 30px, font-size 16px */
        lg: "px-[30px] py-[14px] text-base",
        /** Icon button */
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
