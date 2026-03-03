export async function enrollCourse(userId: string, courseId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/enrollments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, courseId }),
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        message: 'Enrolled successfully!',
        enrollmentId: data.id,
      }
    } else {
      return { success: false, message: data.error || 'Enrollment failed' }
    }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Enrollment failed',
    }
  }
}
