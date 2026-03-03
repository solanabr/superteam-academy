export async function submitLesson(
  userId: string,
  courseId: string,
  lessonId: string,
  xpReward: number
) {
  try {
    const enrollmentResponse = await fetch('/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        courseId,
      }),
    })

    if (!enrollmentResponse.ok && enrollmentResponse.status !== 200) {
      const enrollmentError = await enrollmentResponse.json().catch(() => null)
      return {
        success: false,
        xpAwarded: 0,
        totalXp: 0,
        level: 0,
        message: enrollmentError?.error || 'Failed to create enrollment',
      }
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || ''
    const xpAwardUrl = apiBase ? `${apiBase.replace(/\/$/, '')}/xp/award` : '/api/xp/award'
    const response = await fetch(xpAwardUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        courseId,
        lessonId,
        xpAmount: xpReward,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        xpAwarded: data.xpAwarded,
        totalXp: data.totalXp,
        level: data.level,
        message: data.message,
      }
    } else if (response.status === 400 && data.error === 'Lesson already completed') {
      // Treat already-completed as a success — user already has the XP
      return {
        success: true,
        alreadyCompleted: true,
        xpAwarded: 0,
        totalXp: 0,
        level: 0,
        message: 'Lesson already completed',
      }
    } else {
      return {
        success: false,
        xpAwarded: 0,
        totalXp: 0,
        level: 0,
        message: data.error || 'Failed to award XP',
      }
    }
  } catch (error) {
    return {
      success: false,
      xpAwarded: 0,
      totalXp: 0,
      level: 0,
      message: error instanceof Error ? error.message : 'Submission failed',
    }
  }
}
