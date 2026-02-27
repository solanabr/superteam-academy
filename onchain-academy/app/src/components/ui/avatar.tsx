import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-24 w-24 text-2xl",
};

const pxSizes = { sm: 32, md: 40, lg: 56, xl: 96 } as const;

export function Avatar({
  src,
  alt,
  fallback,
  size = "md",
  className,
}: AvatarProps) {
  const px = pxSizes[size];
  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-[2px] border-2 border-[var(--c-border-subtle)] bg-[var(--c-bg-card)]",
        sizes[size],
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt ?? "User avatar"}
          width={px}
          height={px}
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#00FFA3]/15 text-[#00FFA3] font-semibold">
          {fallback ?? "?"}
        </div>
      )}
    </div>
  );
}
