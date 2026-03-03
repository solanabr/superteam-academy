"use client";

import { useTranslations } from "next-intl";
import { useTracks } from "@/lib/hooks/use-tracks";
import { cn } from "@/lib/utils";

export type Duration = "all" | "lt1" | "1to3" | "3to6" | "6to12" | "gt12";
export type Sort = "newest" | "popular" | "xp";

export interface CourseFiltersProps {
  selectedTrack: number | null;
  onTrackChange: (id: number | null) => void;
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function CourseFilters({
  selectedTrack,
  onTrackChange,
}: CourseFiltersProps) {
  const t = useTranslations("courses");
  const allTracks = useTracks();
  const tracks = Object.entries(allTracks).filter(([id]) => Number(id) !== 0);

  return (
    <>
      {/* Mobile: horizontal scrollable row */}
      <div className="flex lg:hidden items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full">
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
          Track
        </span>
        <Pill
          active={selectedTrack === null}
          onClick={() => onTrackChange(null)}
        >
          {t("filters.allTracks")}
        </Pill>
        {tracks.map(([id, track]) => (
          <Pill
            key={id}
            active={selectedTrack === Number(id)}
            onClick={() =>
              onTrackChange(selectedTrack === Number(id) ? null : Number(id))
            }
          >
            {track.short}
          </Pill>
        ))}
      </div>

      {/* Desktop: vertical sidebar */}
      <aside className="hidden lg:block w-44 shrink-0">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
          Track
        </p>
        <div className="flex flex-col gap-1.5">
          <Pill
            active={selectedTrack === null}
            onClick={() => onTrackChange(null)}
          >
            {t("filters.allTracks")}
          </Pill>
          {tracks.map(([id, track]) => (
            <Pill
              key={id}
              active={selectedTrack === Number(id)}
              onClick={() =>
                onTrackChange(selectedTrack === Number(id) ? null : Number(id))
              }
            >
              {track.display}
            </Pill>
          ))}
        </div>
      </aside>
    </>
  );
}
