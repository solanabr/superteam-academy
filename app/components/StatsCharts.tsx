'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { courses } from '@/lib/data/courses';
import { useI18n } from '@/lib/i18n/context';

const barData = courses.map((c) => ({
  name: c.title,
  fullName: c.title,
  lessons: c.lessons.length,
  duration: c.duration,
}));

const pieData = courses.map((c, i) => ({
  name: c.title,
  value: c.lessons.length,
  color: ['rgb(20 184 166)', 'rgb(99 102 241)', 'rgb(245 158 11)'][i % 3],
}));

const totalLessons = courses.reduce((s, c) => s + c.lessons.length, 0);

const statCards = [
  { label: 'Tracks to master', value: courses.length, border: 'border-l-accent', color: 'text-accent' },
  { label: 'Lessons to complete', value: totalLessons, border: 'border-l-chart-2', color: 'text-chart-2' },
  { label: '~7h to ecosystem ready', value: '7h+', border: 'border-l-chart-3', color: 'text-chart-3' },
];

export function StatsCharts() {
  const { t } = useI18n();
  return (
    <section className="mb-16 w-full min-w-0" aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="text-title mb-2 font-semibold text-[rgb(var(--text))]">
        {t('platformAtGlance')}
      </h2>
      <p className="text-caption mb-6 text-[rgb(var(--text-muted))]">
        {t('platformAtGlanceDesc')}
      </p>

      {/* Stat cards — responsive grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`min-w-0 rounded-xl border border-border/50 border-l-4 ${card.border} bg-surface p-4 shadow-card transition hover:shadow-card-hover sm:p-5`}
          >
            <p className="text-caption font-medium uppercase tracking-wider text-[rgb(var(--text-muted))]">
              {card.label}
            </p>
            <p className={`text-display mt-1 font-semibold ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts — stack on mobile, side-by-side on lg */}
      <div className="mt-8 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Horizontal bar chart — full course names on the left (y-axis) */}
        <div className="min-w-0 rounded-xl border border-border/50 bg-surface p-4 shadow-card sm:p-5">
          <p className="text-body mb-1 font-medium text-[rgb(var(--text))]">
            Lessons per course
          </p>
          <p className="text-caption mb-4 text-[rgb(var(--text-subtle))]">Lessons</p>
          <div className="h-56 w-full min-w-0 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgb(13 148 136)" />
                    <stop offset="100%" stopColor="rgb(20 184 166)" />
                  </linearGradient>
                </defs>
                <XAxis
                  type="number"
                  tick={{ fill: 'rgb(148 163 184)', fontSize: 12 }}
                  axisLine={{ stroke: 'rgb(71 85 105)' }}
                  tickLine={false}
                  allowDecimals={false}
                  width={28}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: 'rgb(148 163 184)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={180}
                  tickFormatter={(value: string) => value}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgb(30 41 59)',
                    border: '1px solid rgb(71 85 105)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'rgb(248 250 252)' }}
                  formatter={(value: number, _name: string, props: { payload?: { name?: string } }) => [
                    `${value} lessons`,
                    props.payload?.name ?? 'Lessons',
                  ]}
                />
                <Bar
                  dataKey="lessons"
                  fill="url(#barGradient)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie — generous margin so percentage labels are not clipped */}
        <div className="min-w-0 rounded-xl border border-border/50 bg-surface p-4 shadow-card sm:p-5">
          <p className="text-body mb-4 font-medium text-[rgb(var(--text))]">
            Course mix
          </p>
          <div className="h-56 w-full min-w-0 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 32, right: 32, bottom: 8, left: 32 }}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={40}
                  outerRadius={58}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="rgb(30 41 59)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgb(30 41 59)',
                    border: '1px solid rgb(71 85 105)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} lessons`,
                    name,
                  ]}
                />
                <Legend
                  layout="vertical"
                  align="center"
                  verticalAlign="bottom"
                  wrapperStyle={{ paddingTop: '12px', maxWidth: '100%' }}
                  formatter={(value: string) => (
                    <span className="inline-block max-w-[200px] break-words text-left text-caption text-[rgb(var(--text-muted))] sm:max-w-none">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
