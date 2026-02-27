
export function calculateStreak(lastActiveDate: Date | string, currentStreak: number): { streak: number; shouldUpdate: boolean } {
  const now = new Date();
  const lastActive = new Date(lastActiveDate);
  
  // Reset time components to compare dates only
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
  
  const diffTime = Math.abs(today.getTime() - last.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
      // Already active today. If streak is 0 (new/legacy user), set to 1. Otherwise maintain.
      return currentStreak === 0 ? { streak: 1, shouldUpdate: true } : { streak: currentStreak, shouldUpdate: false };
  } else if (diffDays === 1) {
      // Active yesterday, increment streak
      return { streak: currentStreak + 1, shouldUpdate: true };
  } else {
      // Missed a day (or more), reset to 1 (since they are active now)
      return { streak: 1, shouldUpdate: true };
  }
}
