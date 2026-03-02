"use client";

import { useTranslations } from "next-intl";
import type { RetentionCohort } from "@/lib/admin-analytics";

interface RetentionGridProps {
  data: RetentionCohort[];
}

function cellColor(pct: number): string {
  if (pct >= 60) return "bg-emerald-500/70 text-white";
  if (pct >= 40) return "bg-emerald-500/40 text-white";
  if (pct >= 20) return "bg-emerald-500/20 text-foreground";
  if (pct > 0) return "bg-emerald-500/10 text-muted-foreground";
  return "bg-muted/30 text-muted-foreground";
}

export function RetentionGrid({ data }: RetentionGridProps) {
  const t = useTranslations("admin.analytics");

  const maxWeeks = Math.max(...data.map((c) => c.retentionByWeek.length), 0);
  const nonEmpty = data.filter((c) => c.cohortSize > 0);

  if (nonEmpty.length === 0) {
    return (
      <div className="glass rounded-xl p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("retentionCohorts")}
        </h3>
        <p className="text-sm text-muted-foreground">{t("noData")}</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {t("retentionCohorts")}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                {t("cohort")}
              </th>
              <th className="px-2 py-1.5 text-center font-medium text-muted-foreground">
                {t("users")}
              </th>
              {Array.from({ length: maxWeeks }).map((_, i) => (
                <th
                  key={i}
                  className="px-2 py-1.5 text-center font-medium text-muted-foreground"
                >
                  {t("weekN", { n: i + 1 })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {nonEmpty.map((cohort) => (
              <tr key={cohort.cohortWeek}>
                <td className="whitespace-nowrap px-2 py-1.5 font-medium">
                  {new Date(cohort.cohortWeek).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-2 py-1.5 text-center text-muted-foreground">
                  {cohort.cohortSize}
                </td>
                {Array.from({ length: maxWeeks }).map((_, i) => {
                  const pct = cohort.retentionByWeek[i];
                  return (
                    <td key={i} className="px-1 py-1">
                      {pct !== undefined ? (
                        <div
                          className={`rounded px-2 py-1 text-center text-[11px] font-medium ${cellColor(pct)}`}
                        >
                          {pct}%
                        </div>
                      ) : (
                        <div className="rounded bg-muted/10 px-2 py-1 text-center text-muted-foreground/30">
                          —
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
