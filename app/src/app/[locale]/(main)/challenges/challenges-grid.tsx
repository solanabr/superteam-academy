"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RemoteImage } from "@/components/remote-image";
import { getDifficultyLabel } from "@/data/challenges";
import type { Challenge, ChallengeStatus } from "@/data/challenges";

const STATUS_FILTERS: {
  value: ChallengeStatus | "";
  labelKey: "filterOpen" | "filterCompleted" | "filterClaimed";
}[] = [
  { value: "open", labelKey: "filterOpen" },
  { value: "completed", labelKey: "filterCompleted" },
  { value: "claimed", labelKey: "filterClaimed" },
];

interface ChallengesGridProps {
  challenges: Challenge[];
}

export function ChallengesGrid({ challenges }: ChallengesGridProps) {
  const t = useTranslations("challenges");
  const [status, setStatus] = useState<ChallengeStatus | "">("open");

  const filtered = useMemo(
    () =>
      !status ? challenges : challenges.filter((c) => c.status === status),
    [challenges, status],
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {STATUS_FILTERS.map(({ value, labelKey }) => (
            <button
              key={value || "all"}
              type="button"
              onClick={() => setStatus(value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] ${
                status === value
                  ? "filter-badge-selected bg-[hsl(var(--brand-logo-green))] text-white"
                  : "bg-[hsl(var(--brand-logo-yellow))] text-[hsl(0,0%,9%)] hover:bg-[hsl(var(--brand-logo-yellow-light))]"
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-muted-foreground">Nenhum desafio neste filtro.</p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((challenge) => (
            <Card
              key={challenge.id}
              className="flex flex-col overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-t-2xl bg-muted">
                <RemoteImage src={challenge.image} alt={challenge.title} />
              </div>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap gap-1.5">
                  <span className="card-badge rounded-md bg-[hsl(var(--brand-logo-yellow))] px-2 py-0.5 text-xs font-medium text-[hsl(0,0%,9%)]">
                    {challenge.track}
                  </span>
                  <span className="card-badge rounded-md bg-[hsl(var(--brand-logo-yellow))] px-2 py-0.5 text-xs font-medium text-[hsl(0,0%,9%)]">
                    {getDifficultyLabel(challenge.difficulty)}
                  </span>
                </div>
                <h3 className="mt-3 text-xl font-bold leading-tight">
                  {challenge.title}
                </h3>
                {challenge.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-black">
                    {challenge.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="mt-auto flex flex-wrap items-center justify-end gap-2 pt-0">
                <Button
                  asChild
                  size="sm"
                  className="card-button gap-1.5 bg-blue-500 text-white hover:bg-blue-600 hover:text-white"
                >
                  <Link
                    href={`/challenges/${challenge.slug}`}
                    className="text-white"
                  >
                    {t("takeChallenge")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
