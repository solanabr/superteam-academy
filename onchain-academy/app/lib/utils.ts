import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function levelBadgeClasses(level: string) {
  switch (level) {
    case "Beginner":
      return "bg-level-beginner text-level-beginner-foreground";
    case "Intermediate":
      return "bg-level-intermediate text-level-intermediate-foreground";
    case "Advanced":
      return "bg-level-advanced text-level-advanced-foreground";
    default:
      return "bg-primary text-primary-foreground";
  }
}
