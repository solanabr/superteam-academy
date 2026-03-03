"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTranslations } from "next-intl";
import type { EnrollmentFunnel as EnrollmentFunnelData } from "@/lib/admin-analytics";

interface EnrollmentFunnelProps {
  data: EnrollmentFunnelData;
}

const COLORS = ["#00D18C", "#FFB800", "#FF6B6B"];

export function EnrollmentFunnel({ data }: EnrollmentFunnelProps) {
  const t = useTranslations("admin.analytics");

  const chartData = [
    { stage: t("enrolled"), value: data.enrolled },
    { stage: t("started"), value: data.started },
    { stage: t("completed"), value: data.completed },
  ];

  const conversionRates = [
    null,
    data.enrolled > 0 ? Math.round((data.started / data.enrolled) * 100) : 0,
    data.started > 0 ? Math.round((data.completed / data.started) * 100) : 0,
  ];

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {t("enrollmentFunnel")}
      </h3>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" barSize={28}>
            <XAxis
              type="number"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              type="category"
              dataKey="stage"
              width={90}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        {conversionRates.map(
          (rate, i) =>
            rate !== null && (
              <span key={i}>
                {chartData[i - 1]?.stage} → {chartData[i]?.stage}:{" "}
                <span className="font-semibold text-foreground">{rate}%</span>
              </span>
            ),
        )}
      </div>
    </div>
  );
}
