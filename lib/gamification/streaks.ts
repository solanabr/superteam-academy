export type StreakEntry = {
  date: string;
  lessonsCompleted: number;
  xpEarned: number;
};

export type StreakSummary = {
  current: number;
  longest: number;
  lastActivityDate: string;
};

export function computeStreakSummary(history: StreakEntry[]): StreakSummary {
  if (history.length === 0) {
    return {
      current: 0,
      longest: 0,
      lastActivityDate: ""
    };
  }

  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  let longest = 1;
  let running = 1;

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = new Date(sorted[i - 1].date);
    const curr = new Date(sorted[i].date);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      running += 1;
    } else if (diffDays > 1) {
      running = 1;
    }
    longest = Math.max(longest, running);
  }

  return {
    current: running,
    longest,
    lastActivityDate: sorted[sorted.length - 1].date
  };
}
