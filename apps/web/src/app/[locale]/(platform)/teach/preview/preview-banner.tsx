import Link from "next/link";
import { ArrowLeft, Eye } from "@phosphor-icons/react/dist/ssr";

interface PreviewBannerProps {
  head: { sha: string; title: string; author: string | null };
  prNumber: number;
  locale: string;
}

/**
 * Standing reminder that this is an unpublished preview (#831), with the way
 * back to the PR form. Rendered above the real course page so a teacher can
 * never mistake a preview for the live catalogue.
 */
export function PreviewBanner({ head, prNumber, locale }: PreviewBannerProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-border px-3 py-2 text-xs [background:var(--input)]">
      <span className="flex items-center gap-1.5 font-bold uppercase text-primary">
        <Eye size={14} weight="duotone" aria-hidden="true" />
        Preview
      </span>
      <span className="min-w-0 flex-1 truncate text-text-3">
        PR #{prNumber} · {head.title}
        {head.author ? ` · by ${head.author}` : ""} · {head.sha.slice(0, 7)}
      </span>
      <Link
        href={`/${locale}/teach/preview`}
        className="inline-flex shrink-0 items-center gap-1 font-semibold text-text-3 underline-offset-2 hover:text-text hover:underline"
      >
        <ArrowLeft size={12} weight="bold" aria-hidden="true" />
        Change PR
      </Link>
    </div>
  );
}
