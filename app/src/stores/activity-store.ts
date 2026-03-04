import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ActivityType = "lesson_completed" | "course_enrolled" | "course_completed" | "achievement_earned";

export interface Activity {
  id: string;
  type: ActivityType;
  courseId?: string;
  courseTitle?: string;
  lessonTitle?: string;
  xpEarned?: number;
  timestamp: number;
}

interface ActivityState {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, "id" | "timestamp">) => Activity;
  removeActivityById: (id: string) => void;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      activities: [],
      addActivity: (activity) => {
        const newActivity: Activity = {
          ...activity,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };
        set((state) => ({
          activities: [newActivity, ...state.activities].slice(0, 50),
        }));
        return newActivity;
      },
      removeActivityById: (id) =>
        set((state) => ({
          activities: state.activities.filter((a) => a.id !== id),
        })),
    }),
    {
      name: "superteam-activity",
    }
  )
);
