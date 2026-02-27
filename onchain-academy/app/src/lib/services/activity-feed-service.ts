export interface ActivityEvent {
  type:
    | "lesson_complete"
    | "course_finalize"
    | "credential_issued"
    | "xp_earned";
  user: string;
  detail: string;
  xp: number;
  timestamp: number;
  signature: string;
}

export async function fetchActivityFeed(): Promise<ActivityEvent[]> {
  const res = await fetch("/api/activity-feed", {
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    throw new Error(`Activity feed request failed: ${res.status}`);
  }

  const data: ActivityEvent[] = await res.json();
  return data;
}
