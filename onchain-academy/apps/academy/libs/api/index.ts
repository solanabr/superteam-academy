export async function fetchAPI<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export { coursesAPI } from './courses.api'
export { lessonsAPI } from './lessons.api'
export { modulesAPI } from './modules.api'
export { streaksAPI } from './streaks.api'
export { usersAPI } from './users.api'
export { xpAPI } from './xp.api'
