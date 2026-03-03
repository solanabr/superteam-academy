"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTranslations } from "next-intl";
import type { DailyCount } from "@/lib/admin-analytics";

interface UserGrowthChartProps {
  data: DailyCount[];
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  const t = useTranslations("admin.analytics");

  // Compute cumulative total
  let cumulative = 0;
  const chartData = data.map((d) => {
    cumulative += d.count;
    return {
      date: d.date,
      newUsers: d.count,
      total: cumulative,
    };
  });

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {t("userGrowth")}
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient
                id="userGrowthGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#00D18C" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00D18C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => {
                const d = new Date(String(v));
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelFormatter={(label) => {
                return new Date(String(label)).toLocaleDateString();
              }}
            />
            <Area
              type="monotone"
              dataKey="newUsers"
              name={t("newUsers")}
              stroke="#00D18C"
              fill="url(#userGrowthGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
