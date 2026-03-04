import { cva, type VariantProps } from "class-variance-authority";
import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none rounded-full cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-white text-black hover:bg-[#e0e0e0] hover:scale-[1.02] shadow-[0_4px_14px_rgba(255,255,255,0.1)]",
        outline: "border border-line bg-transparent text-foreground hover:bg-surface-hover hover:border-white/30",
        ghost: "bg-transparent text-foreground hover:bg-surface-hover",
        brand: "bg-white text-black hover:bg-[#e0e0e0] hover:scale-[1.02] shadow-[0_4px_14px_rgba(255,255,255,0.2)]",
        secondary: "bg-surface-hover text-foreground hover:bg-line",
      },
      size: {
        default: "h-11 px-5 text-[15px]",
        sm: "h-9 px-4 text-[13px]",
        lg: "h-14 px-8 text-[17px] font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
