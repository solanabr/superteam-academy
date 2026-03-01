import { Link } from "@/i18n/navigation";
import { getAllTracks } from "@/lib/data/queries";
import {
  Cube,
  Anchor,
  CurrencyDollar,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import type { ComponentType } from "react";
import type { IconProps } from "@phosphor-icons/react";

const iconMap: Record<string, ComponentType<IconProps>> = {
  Cube,
  Anchor,
  CurrencyDollar,
};

const trackStyles: Record<
  string,
  { iconBg: string; accent: string; hoverBorder: string }
> = {
  "solana-fundamentals": {
    iconBg: "bg-emerald-500/15",
    accent: "text-emerald-500",
    hoverBorder: "hover:border-emerald-500/30",
  },
  "anchor-development": {
    iconBg: "bg-blue-500/15",
    accent: "text-blue-500",
    hoverBorder: "hover:border-blue-500/30",
  },
  "defi-on-solana": {
    iconBg: "bg-amber-500/15",
    accent: "text-amber-500",
    hoverBorder: "hover:border-amber-500/30",
  },
};

export function LearningPathsSection({ title }: { title: string }) {
  const tracks = getAllTracks();

  return (
    <section className="rounded-xl bg-card p-5 ring-1 ring-border">
      <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {tracks.map((track) => {
          const Icon = iconMap[track.icon] ?? Cube;
          const style =
            trackStyles[track.id] ?? trackStyles["solana-fundamentals"];

          return (
            <Link
              key={track.id}
              href={`/courses?track=${track.id}`}
              className="group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-lg"
            >
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg border border-border bg-background p-4 transition-all duration-200",
                  style.hoverBorder,
                )}
              >
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-lg",
                    style.iconBg,
                  )}
                >
                  <Icon
                    className={cn("size-5", style.accent)}
                    weight="duotone"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-sm font-semibold leading-tight">
                    {track.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {track.courseCount} courses
                  </p>
                </div>
                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
                  weight="bold"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
