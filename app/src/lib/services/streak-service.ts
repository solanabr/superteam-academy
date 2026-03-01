// ─── Streak Tracking (Frontend-Only Stub) ────────────────────────
// In production, streak data would be stored on a backend or in
// a user profile PDA. For the bounty demo, we use localStorage.

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  weeklyActivity: boolean[]; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
}

const STREAK_KEY = "superteam-academy-streak";

export function getStreakData(): StreakData {
  if (typeof window === "undefined") {
    return { currentStreak: 0, longestStreak: 0, lastActivityDate: null, weeklyActivity: Array(7).fill(false) };
  }
  
  const stored = localStorage.getItem(STREAK_KEY);
  if (!stored) {
    return { currentStreak: 0, longestStreak: 0, lastActivityDate: null, weeklyActivity: Array(7).fill(false) };
  }
  
  try {
    return JSON.parse(stored);
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastActivityDate: null, weeklyActivity: Array(7).fill(false) };
  }
}

export function recordActivity(): StreakData {
  const data = getStreakData();
  const today = new Date().toISOString().split("T")[0];
  const dayOfWeek = new Date().getDay();
  const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon=0, Sun=6
  
  if (data.lastActivityDate === today) return data;
  
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  
  if (data.lastActivityDate === yesterday) {
    data.currentStreak++;
  } else if (data.lastActivityDate !== today) {
    data.currentStreak = 1;
  }
  
  data.longestStreak = Math.max(data.longestStreak, data.currentStreak);
  data.lastActivityDate = today;
  data.weeklyActivity[adjustedDay] = true;
  
  // Reset week if it's Monday and last activity was last week
  if (adjustedDay === 0 && data.lastActivityDate !== today) {
    data.weeklyActivity = Array(7).fill(false);
    data.weeklyActivity[0] = true;
  }
  
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
  return data;
}
