"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { getAllCourses } from "@/lib/sanity";
import { supabase } from "@/lib/supabase";
import { events } from "@/lib/analytics";
import type { LeaderboardEntry } from "@/types";

interface CourseOption {
  slug: string;
  title: string;
}

export function LeaderboardClient({
  entries,
}: {
  entries: LeaderboardEntry[];
}) {
  const { publicKey } = useWallet();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [courses, setCourses] = useState<CourseOption[]>([]);

  useEffect(() => {
    events.leaderboardView("all");
    getAllCourses().then((all) =>
      setCourses(all.map((c) => ({ slug: c.slug, title: c.title }))),
    );
  }, []);

  const [filteredEntries, setFilteredEntries] =
    useState<LeaderboardEntry[]>(entries);
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    if (!selectedCourse) {
      setFilteredEntries(entries);
      return;
    }

    if (!supabase) {
      setFilteredEntries(entries);
      return;
    }

    let cancelled = false;
    setIsFiltering(true);

    supabase
      .from("lesson_completions")
      .select("wallet_address")
      .eq("course_slug", selectedCourse)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setFilteredEntries(entries);
          setIsFiltering(false);
          return;
        }
        const wallets = new Set(
          data.map((row) => row.wallet_address as string),
        );
        setFilteredEntries(entries.filter((e) => wallets.has(e.walletAddress)));
        setIsFiltering(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCourse, entries]);

  const showFilter = !!supabase;

  return (
    <div>
      {showFilter && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Filter by course
          </span>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            disabled={isFiltering}
            className="bg-card border border-border rounded px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-50 cursor-pointer"
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course.slug} value={course.slug}>
                {course.title}
              </option>
            ))}
          </select>
          {isFiltering && (
            <span className="text-[10px] font-mono text-muted-foreground">
              Loading...
            </span>
          )}
        </div>
      )}
      <LeaderboardTable
        entries={filteredEntries}
        currentWallet={publicKey?.toBase58()}
      />
    </div>
  );
}
