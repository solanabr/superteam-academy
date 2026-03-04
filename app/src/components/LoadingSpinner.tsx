import { cn } from "@/lib/utils"
import { Loader2Icon } from "lucide-react"
import { ComponentProps } from "react"

export function LoadingSpinner({
  className,
  ...props
}: ComponentProps<typeof Loader2Icon>) {
  return (
    <Loader2Icon
      className={cn("animate-spin text-primary h-12 w-12", className)}
      {...props}
    />
  )
}