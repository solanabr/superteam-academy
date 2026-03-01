import Link from "next/link";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  name: string;
  slug: string;
  description: string | null;
}

export function CategoryCard({ name, slug, description }: CategoryCardProps) {
  return (
    <Link
      href={`/community/${slug}`}
      className={cn(
        "block rounded-lg border border-[var(--border-default)] bg-[var(--card)] p-4",
        "transition-all hover:border-[var(--border-hover)] hover:bg-[var(--card-hover)]"
      )}
    >
      <h3 className="font-display font-bold text-[var(--text)]">{name}</h3>
      {description && (
        <p className="mt-1 line-clamp-2 text-sm text-[var(--text-2)]">
          {description}
        </p>
      )}
    </Link>
  );
}
