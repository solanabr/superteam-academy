"use client";

import { useCallback, useRef, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import {
  MagnifyingGlass,
  SortAscending,
  X,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { Track } from "@/lib/data/types";

const DIFFICULTY_OPTIONS = [
  { value: "all", label: "All Levels" },
  { value: "1", label: "Beginner" },
  { value: "2", label: "Intermediate" },
  { value: "3", label: "Advanced" },
] as const;

const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest" },
  { value: "xp-high", label: "Highest XP" },
  { value: "xp-low", label: "Lowest XP" },
] as const;

export function FilterBar({
  tracks,
  resultCount,
}: {
  tracks: Track[];
  resultCount: number;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const currentDifficulty = searchParams.get("difficulty") ?? "all";
  const currentTrack = searchParams.get("track") ?? "all";
  const currentQuery = searchParams.get("q") ?? "";
  const currentSort = searchParams.get("sort") ?? "popular";
  const hasActiveFilters =
    currentDifficulty !== "all" || currentTrack !== "all" || currentQuery !== "";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (
        (key === "difficulty" && value === "all") ||
        (key === "track" && value === "all") ||
        (key === "sort" && value === "popular") ||
        (key === "q" && value === "")
      ) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [searchParams, router, pathname, startTransition],
  );

  const clearAll = useCallback(() => {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }, [router, pathname, startTransition]);

  return (
    <div className={cn("space-y-4", isPending && "opacity-60 pointer-events-none")}>
      <div className="relative">
        <MagnifyingGlass className="absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, topic, or tag..."
          defaultValue={currentQuery}
          onChange={(e) => {
            const value = e.target.value;
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(
              () => updateParams("q", value),
              300,
            );
          }}
          className="h-11 rounded-lg bg-muted/40 pl-10 text-sm placeholder:text-muted-foreground/50 focus-visible:bg-background"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            type="single"
            value={currentDifficulty}
            onValueChange={(value) => {
              if (value) updateParams("difficulty", value);
            }}
          >
            {DIFFICULTY_OPTIONS.map((opt) => (
              <ToggleGroupItem
                key={opt.value}
                value={opt.value}
                size="sm"
                className="cursor-pointer text-xs"
              >
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

          <Select
            value={currentTrack}
            onValueChange={(value) => updateParams("track", value)}
          >
            <SelectTrigger className="h-8 w-[170px] cursor-pointer text-xs">
              <SelectValue placeholder="All Tracks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer text-xs">
                All Tracks
              </SelectItem>
              {tracks.map((track) => (
                <SelectItem
                  key={track.id}
                  value={track.id}
                  className="cursor-pointer text-xs"
                >
                  {track.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select
          value={currentSort}
          onValueChange={(value) => updateParams("sort", value)}
        >
          <SelectTrigger className="h-8 w-[150px] cursor-pointer text-xs">
            <SortAscending className="size-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="cursor-pointer text-xs"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between border-t border-border/50 pt-3">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">{resultCount}</span>{" "}
          {resultCount === 1 ? "course" : "courses"}
        </p>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-7 cursor-pointer gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
