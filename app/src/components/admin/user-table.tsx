"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserAnalytics } from "@/types/admin";
import {
  Trophy,
  Flame,
  BookOpen,
  GraduationCap,
  MessageSquare,
  Search,
  ChevronDown,
  ChevronUp,
  Medal,
} from "lucide-react";

interface UserTableProps {
  users: UserAnalytics[];
  loading: boolean;
  title: string;
  description?: string;
  showAll?: boolean;
}

type SortField =
  | "xpEarned"
  | "lessonsCompleted"
  | "coursesCompleted"
  | "currentStreak"
  | "activityCount"
  | "achievementCount"
  | "commentCount";

export function UserTable({ users, loading, title, description, showAll = false }: UserTableProps) {
  const [sortBy, setSortBy] = useState<SortField>("xpEarned");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCount, setShowCount] = useState(showAll ? 999 : 10);

  const filteredUsers = useMemo(() => {
    let result = [...users];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.username?.toLowerCase().includes(q) ||
          u.displayName?.toLowerCase().includes(q) ||
          u.walletAddress?.toLowerCase().includes(q),
      );
    }
    result.sort((a, b) => {
      const aVal = a[sortBy] ?? 0;
      const bVal = b[sortBy] ?? 0;
      return sortDir === "desc" ? Number(bVal) - Number(aVal) : Number(aVal) - Number(bVal);
    });
    return result.slice(0, showCount);
  }, [users, searchQuery, sortBy, sortDir, showCount]);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  const sortIcon = (field: SortField) => {
    if (sortBy !== field) return null;
    return sortDir === "desc" ? (
      <ChevronDown className="h-3 w-3 inline ml-0.5" />
    ) : (
      <ChevronUp className="h-3 w-3 inline ml-0.5" />
    );
  };

  const rankBadge = (index: number) => {
    if (sortDir !== "desc") return null;
    if (index === 0) return <Medal className="h-4 w-4 text-yellow-500" />;
    if (index === 1) return <Medal className="h-4 w-4 text-zinc-400" />;
    if (index === 2) return <Medal className="h-4 w-4 text-amber-600" />;
    return <span className="text-xs text-muted-foreground w-4 text-center">{index + 1}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 w-60"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-2 w-8">#</th>
                <th className="py-2 pr-4">User</th>
                <th
                  className="py-2 pr-3 cursor-pointer hover:text-foreground whitespace-nowrap"
                  onClick={() => toggleSort("xpEarned")}
                >
                  <Trophy className="h-3.5 w-3.5 inline mr-1" />
                  XP
                  {sortIcon("xpEarned")}
                </th>
                <th
                  className="py-2 pr-3 cursor-pointer hover:text-foreground whitespace-nowrap"
                  onClick={() => toggleSort("lessonsCompleted")}
                >
                  <BookOpen className="h-3.5 w-3.5 inline mr-1" />
                  Lessons
                  {sortIcon("lessonsCompleted")}
                </th>
                <th
                  className="py-2 pr-3 cursor-pointer hover:text-foreground whitespace-nowrap"
                  onClick={() => toggleSort("coursesCompleted")}
                >
                  <GraduationCap className="h-3.5 w-3.5 inline mr-1" />
                  Courses
                  {sortIcon("coursesCompleted")}
                </th>
                <th
                  className="py-2 pr-3 cursor-pointer hover:text-foreground whitespace-nowrap"
                  onClick={() => toggleSort("currentStreak")}
                >
                  <Flame className="h-3.5 w-3.5 inline mr-1" />
                  Streak
                  {sortIcon("currentStreak")}
                </th>
                <th
                  className="py-2 pr-3 cursor-pointer hover:text-foreground whitespace-nowrap"
                  onClick={() => toggleSort("achievementCount")}
                >
                  Achievements
                  {sortIcon("achievementCount")}
                </th>
                <th
                  className="py-2 pr-3 cursor-pointer hover:text-foreground whitespace-nowrap"
                  onClick={() => toggleSort("commentCount")}
                >
                  <MessageSquare className="h-3.5 w-3.5 inline mr-1" />
                  Comments
                  {sortIcon("commentCount")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, i) => (
                <tr key={user.userId} className="border-b border-border/50 hover:bg-accent/30">
                  <td className="py-2.5 pr-2">{rankBadge(i)}</td>
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      {user.avatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {(user.displayName || user.username)?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate text-sm">
                          {user.displayName || user.username || "Anonymous"}
                        </p>
                        {user.walletAddress && (
                          <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                            {user.walletAddress.slice(0, 4)}...{user.walletAddress.slice(-4)}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 font-medium tabular-nums">
                    {user.xpEarned.toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums">{user.lessonsCompleted}</td>
                  <td className="py-2.5 pr-3 tabular-nums">
                    <span>{user.coursesCompleted}</span>
                    <span className="text-muted-foreground">/{user.coursesEnrolled}</span>
                  </td>
                  <td className="py-2.5 pr-3">
                    {user.currentStreak > 0 ? (
                      <Badge
                        variant="outline"
                        className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
                      >
                        <Flame className="h-3 w-3 mr-0.5" />
                        {user.currentStreak}d
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums">{user.achievementCount}</td>
                  <td className="py-2.5 pr-3 tabular-nums">{user.commentCount}</td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!showAll && users.length > showCount && (
        <button
          onClick={() => setShowCount((c) => c + 20)}
          className="text-sm text-primary hover:underline"
        >
          Show more ({users.length - showCount} remaining)
        </button>
      )}
    </div>
  );
}
