'use client';

import { useMemo } from 'react';
import { TrendingUp, Users, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface EnrollmentPoint {
  date: string;
  count: number;
}

interface FunnelStep {
  label: string;
  count: number;
}

// Mock: enrollments over last 30 days
const MOCK_ENROLLMENT_DATA: EnrollmentPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  // Seeded pseudo-random for determinism
  const seed = ((i + 7) * 16807) % 2147483647;
  const count = Math.floor(((seed - 1) / 2147483646) * 15) + 2;
  return {
    date: date.toISOString().split('T')[0]!,
    count,
  };
});

const MOCK_FUNNEL: FunnelStep[] = [
  { label: 'Enrolled', count: 342 },
  { label: 'Lesson 1', count: 310 },
  { label: 'Lesson 2', count: 268 },
  { label: 'Lesson 3', count: 241 },
  { label: 'Lesson 4', count: 189 },
  { label: 'Completed', count: 142 },
];

const MOCK_RATING = 4.3;

interface CourseAnalyticsProps {
  className?: string;
}

/**
 * SVG line chart for enrollment trend data.
 * Renders a smooth polyline with gradient fill beneath.
 */
function EnrollmentChart({ data }: { data: EnrollmentPoint[] }) {
  const { points, fillPath } = useMemo(() => {
    const counts = data.map((d) => d.count);
    const maxVal = Math.max(...counts, 1);
    const width = 400;
    const height = 120;
    const padding = { top: 10, right: 10, bottom: 20, left: 10 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const pts = data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartW;
      const y = padding.top + chartH - (d.count / maxVal) * chartH;
      return { x, y };
    });

    const linePoints = pts.map((p) => `${p.x},${p.y}`).join(' ');
    const fill = [
      `M${pts[0]!.x},${padding.top + chartH}`,
      ...pts.map((p) => `L${p.x},${p.y}`),
      `L${pts[pts.length - 1]!.x},${padding.top + chartH}`,
      'Z',
    ].join(' ');

    return { points: linePoints, fillPath: fill, max: maxVal };
  }, [data]);

  return (
    <svg viewBox="0 0 400 120" className="h-32 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="enrollment-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#enrollment-fill)" />
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Horizontal bar funnel showing lesson drop-off.
 */
function CompletionFunnel({ steps }: { steps: FunnelStep[] }) {
  const maxCount = steps[0]?.count ?? 1;

  return (
    <div className="space-y-2">
      {steps.map((step) => {
        const pct = (step.count / maxCount) * 100;
        return (
          <div key={step.label} className="flex items-center gap-3">
            <span className="w-20 text-right text-xs text-muted-foreground shrink-0">
              {step.label}
            </span>
            <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-primary/80 transition-all"
                style={{ width: `${pct}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium">
                {step.count}
              </span>
            </div>
            <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
              {Math.round(pct)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Star rating display.
 */
function StarRating({ rating }: { rating: number }) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = i + 1 <= Math.floor(rating);
    const partial = !filled && i < rating;
    return { filled, partial, index: i };
  });

  return (
    <div className="flex items-center gap-1">
      {stars.map((star) => (
        <Star
          key={star.index}
          className={cn(
            'size-4',
            star.filled
              ? 'fill-amber-400 text-amber-400'
              : star.partial
                ? 'fill-amber-400/50 text-amber-400'
                : 'text-muted-foreground/30',
          )}
        />
      ))}
      <span className="ml-1 text-sm font-semibold">{rating.toFixed(1)}</span>
    </div>
  );
}

export function CourseAnalytics({ className }: CourseAnalyticsProps) {
  const totalEnrollments = MOCK_ENROLLMENT_DATA.reduce((s, d) => s + d.count, 0);

  return (
    <Card className={cn('py-0', className)}>
      <CardHeader className="pt-4 px-4 pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" />
          <CardTitle className="text-base">Course Analytics</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-6">
        {/* Enrollment trend */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Enrollments (30 days)</h4>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="size-3" />
              {totalEnrollments} total
            </div>
          </div>
          <EnrollmentChart data={MOCK_ENROLLMENT_DATA} />
        </div>

        {/* Completion funnel */}
        <div>
          <h4 className="mb-3 text-sm font-medium">Completion Funnel</h4>
          <CompletionFunnel steps={MOCK_FUNNEL} />
        </div>

        {/* Average rating */}
        <div>
          <h4 className="mb-2 text-sm font-medium">Average Rating</h4>
          <StarRating rating={MOCK_RATING} />
          <p className="mt-1 text-xs text-muted-foreground">Based on 86 reviews</p>
        </div>
      </CardContent>
    </Card>
  );
}
