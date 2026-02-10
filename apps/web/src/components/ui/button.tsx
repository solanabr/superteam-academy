import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-display font-extrabold transition-all duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white rounded-md shadow-push hover:bg-primary-hover active:translate-y-[3px] active:shadow-push-active",
        destructive:
          "bg-danger text-white rounded-md shadow-push active:translate-y-[3px] active:shadow-push-active",
        outline:
          "bg-card text-text border-[2.5px] border-border rounded-md shadow-push hover:bg-subtle active:translate-y-[3px] active:shadow-push-active",
        secondary:
          "bg-secondary text-white rounded-md shadow-push hover:bg-secondary-light active:translate-y-[3px] active:shadow-push-active",
        ghost:
          "bg-transparent text-text-2 shadow-none hover:bg-subtle hover:text-text",
        link: "text-primary underline-offset-4 hover:underline shadow-none",
        push: "bg-primary text-white rounded-md shadow-push hover:bg-primary-hover active:translate-y-[3px] active:shadow-push-active",
        pushOutline:
          "bg-card text-text border-[2.5px] border-border rounded-md shadow-push hover:bg-subtle active:translate-y-[3px] active:shadow-push-active",
        pushSuccess:
          "bg-success text-white rounded-md shadow-push hover:bg-success-dark active:translate-y-[3px] active:shadow-push-active",
        pushAccent:
          "bg-accent text-white rounded-md shadow-push hover:bg-accent-hover active:translate-y-[3px] active:shadow-push-active",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-9 rounded-sm px-3 text-[13px]",
        lg: "h-11 rounded-lg px-8 text-[17px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
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
