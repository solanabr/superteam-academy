import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type AdminButtonVariant = "primary" | "neutral" | "danger" | "success";

interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AdminButtonVariant;
}

/**
 * One admin button, one size. Every variant keeps the platform's tactile
 * `shadow-push` press convention (`active:translate-y` + `active:shadow-push-active`)
 * and a focus-visible ring. Action columns pair exactly two: a `primary` and a
 * `neutral` outline — no mixed paddings.
 */
const BASE =
  "inline-flex items-center justify-center rounded-md px-3 py-1 font-display text-xs font-bold transition-all duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<AdminButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-push hover:bg-primary-hover focus-visible:outline-primary active:translate-y-[3px] active:shadow-push-active",
  neutral:
    "border border-border bg-card text-text-2 shadow-push-sm hover:bg-subtle focus-visible:outline-primary active:translate-y-[2px] active:shadow-push-active",
  danger:
    "bg-danger text-white shadow-push hover:opacity-90 focus-visible:outline-danger active:translate-y-[3px] active:shadow-push-active",
  success:
    "border border-success bg-card text-success shadow-push-sm hover:bg-success-light focus-visible:outline-success active:translate-y-[2px] active:shadow-push-active",
};

export const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(
  function AdminButton(
    { variant = "neutral", type = "button", className, children, ...rest },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(BASE, VARIANTS[variant], className)}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
