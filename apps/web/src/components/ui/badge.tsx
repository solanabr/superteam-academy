import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center border-[2px] border-border px-2.5 py-0.5 text-xs font-bold uppercase transition-colors focus:outline-none focus:ring-3 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground",
        secondary:
          "bg-secondary text-secondary-foreground",
        destructive:
          "bg-destructive text-destructive-foreground",
        outline: "text-foreground bg-transparent",
        accent: "bg-accent text-accent-foreground",
        warning: "bg-warning text-warning-foreground",
      },
      shape: {
        rectangle: "rounded-none",
        pill: "rounded-full px-3 py-1",
      }
    },
    defaultVariants: {
      variant: "default",
      shape: "rectangle",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, shape, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, shape }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
