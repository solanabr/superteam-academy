import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-surface border border-white/10 rounded-[24px] apple-shadow apple-shadow-hover overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}
