"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Code2,
  CheckCircle2,
  Trophy,
  Search,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DailyChallengeBanner } from "@/components/daily-challenge-banner";
import {
  usePracticeProgress,
  useClaimMilestone,
  useDailyArchive,
} from "@/lib/hooks/use-service";
import { PRACTICE_CHALLENGES } from "@/lib/data/practice-challenges";
import {
  PRACTICE_CATEGORIES,
  PRACTICE_DIFFICULTY_CONFIG,
  PRACTICE_MILESTONES,
  MILESTONE_LEVELS,
} from "@/types/practice";
import type { PracticeDifficulty, PracticeCategory } from "@/types/practice";

export default function PracticePage() {
  const t = useTranslations("practice");
  const tc = useTranslations("common");

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<PracticeDifficulty | "all">(
    "all",
  );
  const [category, setCategory] = useState<PracticeCategory | "all">("all");
  const [language, setLanguage] = useState<"all" | "rust" | "typescript">(
    "all",
  );
  const [status, setStatus] = useState<"all" | "solved" | "unsolved">("all");

  const {
    completed: completedIds,
    txHashes,
    claimedMilestones,
    milestoneTxHashes,
  } = usePracticeProgress();
  const claimMilestone = useClaimMilestone();
  const { data: dailyArchive } = useDailyArchive();

  const allChallenges = useMemo(() => {
    const archived = dailyArchive ?? [];
    return [...PRACTICE_CHALLENGES, ...archived];
  }, [dailyArchive]);

  const solvedCount = completedIds.length;
  const totalCount = allChallenges.length;
  const totalXP = completedIds.reduce((sum, id) => {
    const c = allChallenges.find((ch) => ch.id === id);
    return sum + (c?.xpReward ?? 0);
  }, 0);

  const filtered = useMemo(() => {
    return allChallenges.filter((c) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !c.title.toLowerCase().includes(q) &&
          !c.description.toLowerCase().includes(q)
        )
          return false;
      }
      if (difficulty !== "all" && c.difficulty !== difficulty) return false;
      if (category !== "all" && c.category !== category) return false;
      if (language !== "all" && c.language !== language) return false;
      if (status === "solved" && !completedIds.includes(c.id)) return false;
      if (status === "unsolved" && completedIds.includes(c.id)) return false;
      return true;
    });
  }, [
    search,
    difficulty,
    category,
    language,
    status,
    completedIds,
    allChallenges,
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Daily Challenge Banner */}
      <DailyChallengeBanner />

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-solana-purple/10">
              <Code2 className="h-5 w-5 text-solana-purple" />
            </div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
          </div>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold">
              {solvedCount}
              <span className="text-muted-foreground font-normal">
                /{totalCount}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">{tc("solved")}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-xp-gold">{totalXP}</p>
            <p className="text-xs text-muted-foreground">{t("xpEarned")}</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-solana-purple transition-all"
            style={{ width: `${(solvedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Milestones */}
      <div className="mb-8 flex flex-wrap gap-3">
        {PRACTICE_MILESTONES.map((m) => {
          const reached = solvedCount >= m;
          const claimed = claimedMilestones.includes(m);
          const txHash = milestoneTxHashes[String(m)];
          const level = MILESTONE_LEVELS[m];
          return (
            <div
              key={m}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                reached ? "border-transparent" : "border-border opacity-50",
              )}
              style={
                reached
                  ? {
                      borderColor: level.color,
                      backgroundColor: `${level.color}10`,
                    }
                  : undefined
              }
            >
              <Trophy
                className="h-4 w-4"
                style={{ color: reached ? level.color : undefined }}
              />
              <span className="font-medium">{level.name}</span>
              <span className="text-xs text-muted-foreground">
                {t("solvedLabel", { count: m })}
              </span>
              {reached && claimed && txHash ? (
                <a
                  href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-solana-green hover:underline"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : reached && !claimed ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  disabled={claimMilestone.isPending}
                  onClick={() => claimMilestone.mutate(m)}
                >
                  {t("claim", { amount: level.solReward })}
                </Button>
              ) : null}
            </div>
          );
        })}
        {solvedCount >= PRACTICE_MILESTONES[0] && (
          <Button asChild variant="outline" size="sm">
            <Link href="/practice/certificate">{t("viewCertificate")}</Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative sm:max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={difficulty}
            onValueChange={(v) =>
              setDifficulty(v as PracticeDifficulty | "all")
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allLevels")}</SelectItem>
              {(["easy", "medium", "hard"] as const).map((d) => (
                <SelectItem key={d} value={d}>
                  {PRACTICE_DIFFICULTY_CONFIG[d].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as PracticeCategory | "all")}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allCategories")}</SelectItem>
              {(
                Object.entries(PRACTICE_CATEGORIES) as [
                  PracticeCategory,
                  { label: string },
                ][]
              ).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={language}
            onValueChange={(v) =>
              setLanguage(v as "all" | "rust" | "typescript")
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allLanguages")}</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="rust">Rust</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as "all" | "solved" | "unsolved")}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tc("all")}</SelectItem>
              <SelectItem value="solved">{tc("solved")}</SelectItem>
              <SelectItem value="unsolved">{tc("unsolved")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Challenge table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg font-medium">{t("noChallenges")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("adjustFilters")}
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium w-10">#</th>
                    <th className="px-4 py-3 font-medium">{t("tableTitle")}</th>
                    <th className="px-4 py-3 font-medium w-24">
                      {t("tableDifficulty")}
                    </th>
                    <th className="px-4 py-3 font-medium w-32">
                      {t("tableCategory")}
                    </th>
                    <th className="px-4 py-3 font-medium w-24">
                      {t("tableLanguage")}
                    </th>
                    <th className="px-4 py-3 font-medium w-16 text-right">
                      {tc("xp")}
                    </th>
                    <th className="px-4 py-3 font-medium w-12 text-center">
                      {t("tableStatus")}
                    </th>
                    <th className="px-4 py-3 font-medium w-24 text-center">
                      {t("tableTx")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => {
                    const solved = completedIds.includes(c.id);
                    const diffConfig = PRACTICE_DIFFICULTY_CONFIG[c.difficulty];
                    const catConfig = PRACTICE_CATEGORIES[c.category];
                    return (
                      <tr
                        key={c.id}
                        className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3.5 text-muted-foreground/70 tabular-nums">
                          {i + 1}
                        </td>
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/practice/${c.id}`}
                            className="font-medium hover:text-solana-purple transition-colors"
                          >
                            {c.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className="text-xs font-bold"
                            style={{ color: diffConfig.color }}
                          >
                            {diffConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            variant="outline"
                            className="text-xs font-medium"
                            style={{
                              borderColor: catConfig.color,
                              color: catConfig.color,
                            }}
                          >
                            {catConfig.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 capitalize text-xs font-medium">
                          {c.language === "rust" ? "Rust" : "TypeScript"}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-xp-gold">
                          {c.xpReward}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {solved && (
                            <CheckCircle2 className="h-4 w-4 text-solana-green mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {txHashes[c.id] && (
                            <a
                              href={`https://explorer.solana.com/tx/${txHashes[c.id]}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-solana-purple hover:underline"
                            >
                              {txHashes[c.id].slice(0, 4)}...
                              {txHashes[c.id].slice(-4)}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
