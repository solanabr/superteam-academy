import type { ActivityItem } from "@/types";

export interface ActivityService {
  getActivities(userId: string, limit?: number): Promise<ActivityItem[]>;
  logActivity(userId: string, activity: Omit<ActivityItem, "id">): Promise<ActivityItem>;
}
