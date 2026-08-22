import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   Superteam Academy Button — the INK construction (owner decision A, 22-08)

   The button adopts the same construction as the achievement patch and the
   glyph chip: flat fill, ink outline, hard offset shadow, pressed-key active
   state. It was previously a selection-style CTA (teal fill, white text,
   borderless, coloured push shadow); it is now system-style, so a button, a
   chip and a patch read as the same family of object.

   The visual values live in `.btn-ink*` in globals.css and share the ink
   palette with the chips, so a button's green can never drift from a chip's.
   The variant/size API here is UNCHANGED — every existing call site keeps
   working; only the emitted class strings differ.

   Theme rule (from the mock's dark strip): the FILLED variants keep dark ink
   on both grounds, because their fill supplies the contrast. Only `secondary`
   flips its ink to cream in dark mode — a dark outline on a dark card is
   invisible.
   ═══════════════════════════════════════════════════════════════ */

/** Filled green: the primary action, and every alias that used to mean it. */
const INK_PRIMARY = "btn-ink btn-ink--primary";
/** Card plate with an ink outline — the only variant whose ink flips. */
const INK_SECONDARY = "btn-ink btn-ink--secondary";
/** Filled orange for destructive actions; keeps the danger focus ring. */
const INK_DANGER = "btn-ink btn-ink--danger focus-visible:outline-danger";

const buttonVariants = cva(
  /* Base. Border, shadow, active-press and disabled all come from `.btn-ink`
     for the constructed variants; the quiet ones (ghost/link) opt out by not
     carrying it. */
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-display font-extrabold cursor-pointer no-underline transition-all duration-[120ms] ease rounded-md text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none",
  {
    variants: {
      variant: {
        /** Primary — the green ink button. */
        primary: INK_PRIMARY,

        /** Secondary — card plate, ink outline, theme-flipping ink. */
        secondary: INK_SECONDARY,

        /** Accent — XP amber, ink outline and shadow. */
        accent: "btn-ink bg-xp text-[color:var(--ink-dark)]",

        /* ── Quiet variants: borderless, shadowless, no press ── */

        /** Ghost — no border, no shadow, subtle hover */
        ghost:
          "bg-transparent text-text-2 shadow-none border-none hover:bg-subtle hover:text-text active:translate-y-0",

        /** Link style — inline text link */
        link: "text-primary underline-offset-4 hover:underline shadow-none border-none active:translate-y-0",

        /* ── Backward-compat aliases for pre-v9 variant names ── */

        /** Push — alias for primary */
        push: INK_PRIMARY,

        /** pushSuccess — alias for primary */
        pushSuccess: INK_PRIMARY,

        /** outline / pushOutline — aliases for secondary */
        outline: INK_SECONDARY,
        pushOutline: INK_SECONDARY,

        /** default — alias for primary */
        default: INK_PRIMARY,

        /** pushAccent — alias for accent */
        pushAccent: "btn-ink bg-xp text-[color:var(--ink-dark)]",

        /** destructive — filled orange, danger focus ring */
        destructive: INK_DANGER,

        /**
         * destructiveOutline — danger-tinted secondary for destructive
         * triggers. Counterpart of `outline`, which turns primary on hover —
         * wrong for danger actions.
         */
        destructiveOutline:
          "btn-ink btn-ink--secondary text-danger hover:bg-danger-light focus-visible:outline-danger",
      },
      size: {
        /** Default: padding 11px 22px, font-size 14px */
        default: "px-[22px] py-[11px] text-sm",
        /** Small: padding 7px 14px, font-size 12px, shallower shadow */
        sm: "btn-ink--sm px-[14px] py-[7px] text-xs rounded-sm",
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
