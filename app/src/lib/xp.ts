const XP_KEY = 'solana_academy_xp';
const COMPLETED_LESSONS_KEY = 'solana_academy_completed_lessons';
const ENROLLED_COURSES_KEY = 'solana_academy_enrolled_courses';
const STREAKS_KEY = 'solana_academy_streak';

export interface UserProgress {
  xp: number;
  completedLessons: string[];
  enrolledCourses: string[];
  streak: number;
  lastActiveDate: string | null;
}

export function getProgress(): UserProgress {
  const xp = parseInt(localStorage.getItem(XP_KEY) || '0', 10);
  const completedLessons = JSON.parse(localStorage.getItem(COMPLETED_LESSONS_KEY) || '[]');
  const enrolledCourses = JSON.parse(localStorage.getItem(ENROLLED_COURSES_KEY) || '[]');
  const streakData = JSON.parse(localStorage.getItem(STREAKS_KEY) || '{"streak": 0, "lastActiveDate": null}');
  
  return {
    xp,
    completedLessons,
    enrolledCourses,
    streak: streakData.streak,
    lastActiveDate: streakData.lastActiveDate,
  };
}

export function addXP(amount: number): number {
  const current = parseInt(localStorage.getItem(XP_KEY) || '0', 10);
  const newXP = current + amount;
  localStorage.setItem(XP_KEY, newXP.toString());
  updateStreak();
  return newXP;
}

export function completeLesson(lessonId: string, xpReward: number): { newXP: number; alreadyCompleted: boolean } {
  const completed = JSON.parse(localStorage.getItem(COMPLETED_LESSONS_KEY) || '[]') as string[];
  
  if (completed.includes(lessonId)) {
    return { newXP: parseInt(localStorage.getItem(XP_KEY) || '0', 10), alreadyCompleted: true };
  }
  
  completed.push(lessonId);
  localStorage.setItem(COMPLETED_LESSONS_KEY, JSON.stringify(completed));
  const newXP = addXP(xpReward);
  
  return { newXP, alreadyCompleted: false };
}

export function enrollCourse(courseId: string): void {
  const enrolled = JSON.parse(localStorage.getItem(ENROLLED_COURSES_KEY) || '[]') as string[];
  if (!enrolled.includes(courseId)) {
    enrolled.push(courseId);
    localStorage.setItem(ENROLLED_COURSES_KEY, JSON.stringify(enrolled));
  }
}

export function updateStreak(): void {
  const today = new Date().toDateString();
  const streakData = JSON.parse(localStorage.getItem(STREAKS_KEY) || '{"streak": 0, "lastActiveDate": null}');
  
  if (streakData.lastActiveDate === today) return;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (streakData.lastActiveDate === yesterday.toDateString()) {
    streakData.streak += 1;
  } else if (streakData.lastActiveDate !== today) {
    streakData.streak = 1;
  }
  
  streakData.lastActiveDate = today;
  localStorage.setItem(STREAKS_KEY, JSON.stringify(streakData));
}

export function isLessonCompleted(lessonId: string): boolean {
  const completed = JSON.parse(localStorage.getItem(COMPLETED_LESSONS_KEY) || '[]') as string[];
  return completed.includes(lessonId);
}

export function getCourseProgress(courseId: string, totalLessons: string[]): number {
  const completed = JSON.parse(localStorage.getItem(COMPLETED_LESSONS_KEY) || '[]') as string[];
  const completedInCourse = totalLessons.filter(id => completed.includes(id));
  return totalLessons.length > 0 ? Math.round((completedInCourse.length / totalLessons.length) * 100) : 0;
}

export function getLevel(xp: number): { level: number; title: string; nextLevelXP: number; currentLevelXP: number } {
  const levels = [
    { level: 1, title: 'Newbie Node', xpRequired: 0 },
    { level: 2, title: 'Devnet Explorer', xpRequired: 100 },
    { level: 3, title: 'Testnet Warrior', xpRequired: 300 },
    { level: 4, title: 'Mainnet Apprentice', xpRequired: 600 },
    { level: 5, title: 'Anchor Architect', xpRequired: 1000 },
    { level: 6, title: 'DeFi Sage', xpRequired: 1500 },
    { level: 7, title: 'Solana Validator', xpRequired: 2500 },
    { level: 8, title: 'Protocol Pioneer', xpRequired: 4000 },
    { level: 9, title: 'Blockchain Virtuoso', xpRequired: 6000 },
    { level: 10, title: 'Solana Grandmaster', xpRequired: 10000 },
  ];
  
  let currentLevel = levels[0];
  let nextLevel = levels[1];
  
  for (let i = 0; i < levels.length; i++) {
    if (xp >= levels[i].xpRequired) {
      currentLevel = levels[i];
      nextLevel = levels[i + 1] || levels[levels.length - 1];
    }
  }
  
  return {
    level: currentLevel.level,
    title: currentLevel.title,
    nextLevelXP: nextLevel.xpRequired,
    currentLevelXP: currentLevel.xpRequired,
  };
}
