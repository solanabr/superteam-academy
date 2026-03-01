import { Link } from "@/i18n/navigation";
import { DifficultyBadge } from "./difficulty-badge";
import {
  Clock,
  BookOpen,
  Lightning,
  Users,
  ArrowUpRight,
} from "@phosphor-icons/react/dist/ssr";
import type { Course } from "@/lib/data/types";

const trackAccent: Record<string, string> = {
  "solana-fundamentals": "bg-emerald-500",
  "anchor-development": "bg-blue-500",
  "defi-on-solana": "bg-amber-500",
};

export function CourseCard({ course }: { course: Course }) {
  const accent = trackAccent[course.trackId] ?? "bg-emerald-500";

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group relative cursor-pointer focus-visible:outline-none"
    >
      <article className="relative flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-all duration-200 group-hover:border-primary/40 group-hover:bg-card/80 group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <div className={`absolute left-0 top-6 h-8 w-1 rounded-r-full ${accent}`} />

        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-heading text-base font-semibold leading-tight tracking-tight">
              {course.title}
            </h3>
            <p className="text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
              {course.shortDescription}
            </p>
          </div>
          <ArrowUpRight className="size-4 shrink-0 text-muted-foreground/50 transition-all duration-200 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <DifficultyBadge difficulty={course.difficulty} />
          <span className="text-[11px] text-muted-foreground">
            {course.creator.name}
          </span>
        </div>

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <BookOpen className="size-3.5" weight="duotone" />
                {course.totalLessons}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" weight="duotone" />
                {Math.round(course.totalDuration / 60)}h
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="size-3.5" weight="duotone" />
                {course.enrollmentCount.toLocaleString()}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary">
              <Lightning className="size-3.5" weight="fill" />
              {course.xpReward.toLocaleString()}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
