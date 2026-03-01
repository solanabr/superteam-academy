import { BACKEND_URL } from '@/config/constants';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

export async function completeLesson(courseId: string, lessonIndex: number, learner: string) {
  return apiFetch<{ signature: string }>('/api/complete-lesson', {
    method: 'POST',
    body: JSON.stringify({ courseId, lessonIndex, learner }),
  });
}

export async function finalizeCourse(courseId: string, learner: string) {
  return apiFetch<{ signature: string }>('/api/finalize-course', {
    method: 'POST',
    body: JSON.stringify({ courseId, learner }),
  });
}

export async function issueCredential(
  courseId: string,
  learner: string,
  credentialName: string,
  metadataUri: string,
  coursesCompleted: number,
  totalXp: number
) {
  return apiFetch<{ signature: string; credentialAsset: string }>('/api/issue-credential', {
    method: 'POST',
    body: JSON.stringify({ courseId, learner, credentialName, metadataUri, coursesCompleted, totalXp }),
  });
}

export async function fetchLeaderboard() {
  return apiFetch<{ entries: { wallet: string; xpBalance: number }[] }>('/api/leaderboard');
}

export async function fetchCredentials(wallet: string) {
  return apiFetch<{ credentials: any[] }>(`/api/credentials/${wallet}`);
}

export async function recordStreak(wallet: string) {
  return apiFetch<{ streak: number; longest: number }>('/api/streak', {
    method: 'POST',
    body: JSON.stringify({ wallet }),
  });
}

export async function getStreak(wallet: string) {
  return apiFetch<{ streak: number; longest: number; lastDate: string | null }>(`/api/streak/${wallet}`);
}

export async function getCourseContent(contentTxId: string) {
  return apiFetch<{ content: any }>(`/api/content/${contentTxId}`);
}
