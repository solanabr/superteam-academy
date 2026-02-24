const STREAK_KEY = "superteam-streak";
const HISTORY_KEY = "superteam-streak-history";
const FREEZE_KEY = "superteam-streak-freeze";

interface StreakData {
  count: number;
  lastActiveDate: string;
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function load(): StreakData {
  if (typeof window === "undefined") return { count: 0, lastActiveDate: "" };
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { count: 0, lastActiveDate: "" };
    return JSON.parse(raw);
  } catch {
    return { count: 0, lastActiveDate: "" };
  }
}

function save(data: StreakData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

export function getStreak(): number {
  const data = load();
  const t = today();
  const y = yesterday();
  if (data.lastActiveDate === t || data.lastActiveDate === y) return data.count;
  if (getFreezeCount() > 0 && data.count > 0) return data.count;
  return 0;
}

export function isActiveToday(): boolean {
  return load().lastActiveDate === today();
}

export function recordActivity(): number {
  const data = load();
  const t = today();
  if (data.lastActiveDate === t) return data.count;

  let newCount: number;
  if (data.lastActiveDate === yesterday()) {
    newCount = data.count + 1;
  } else if (getFreezeCount() > 0 && data.count > 0) {
    consumeFreeze();
    newCount = data.count + 1;
  } else {
    newCount = 1;
  }

  const updated = { count: newCount, lastActiveDate: t };
  save(updated);
  addToHistory(t);
  checkMilestones(newCount);
  return newCount;
}

// Activity history for calendar
export function getActivityHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addToHistory(date: string) {
  if (typeof window === "undefined") return;
  const history = getActivityHistory();
  if (!history.includes(date)) {
    history.push(date);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 365);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    const filtered = history.filter((d) => d >= cutoffStr);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  }
}

// Streak freeze
export function getFreezeCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(FREEZE_KEY);
    return raw ? JSON.parse(raw) : 0;
  } catch {
    return 0;
  }
}

export function addFreeze(count: number = 1) {
  if (typeof window === "undefined") return;
  const current = getFreezeCount();
  localStorage.setItem(FREEZE_KEY, JSON.stringify(Math.min(current + count, 5)));
}

function consumeFreeze() {
  if (typeof window === "undefined") return;
  const current = getFreezeCount();
  if (current > 0) {
    localStorage.setItem(FREEZE_KEY, JSON.stringify(current - 1));
  }
}

// Milestones
export interface StreakMilestone {
  days: number;
  reward: string;
  achieved: boolean;
}

const MILESTONES = [
  { days: 3, reward: "streak_freeze" },
  { days: 7, reward: "streak_freeze" },
  { days: 14, reward: "badge" },
  { days: 30, reward: "streak_freeze_x2" },
  { days: 60, reward: "badge" },
  { days: 100, reward: "legendary_badge" },
];

export function getMilestones(): StreakMilestone[] {
  const streak = getStreak();
  return MILESTONES.map((m) => ({
    ...m,
    achieved: streak >= m.days,
  }));
}

function checkMilestones(streak: number) {
  if (streak === 3 || streak === 7) addFreeze(1);
  if (streak === 30) addFreeze(2);
}

export function getCalendarData(days: number = 84): { date: string; active: boolean }[] {
  const history = new Set(getActivityHistory());
  const result: { date: string; active: boolean }[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    result.push({ date: dateStr, active: history.has(dateStr) });
  }

  return result;
}
