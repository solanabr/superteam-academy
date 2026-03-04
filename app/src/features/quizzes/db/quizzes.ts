import { db } from "@/drizzle/db"
import { AssignmentTable, AssignmentSubmissionTable } from "@/drizzle/schema"
import { recalculateCourseXp } from "@/features/courses/db/courses"
import { eq, and, desc, asc } from "drizzle-orm"

export async function insertAssignment(data: typeof AssignmentTable.$inferInsert) {
  const [assignment] = await db.insert(AssignmentTable).values(data).returning()
  if (assignment?.courseId) {
    await recalculateCourseXp(assignment.courseId)
  }
  return assignment
}

export async function updateAssignment(id: string, data: Partial<typeof AssignmentTable.$inferInsert>) {
  const [assignment] = await db
    .update(AssignmentTable)
    .set(data)
    .where(eq(AssignmentTable.id, id))
    .returning()
  if (assignment?.courseId) {
    await recalculateCourseXp(assignment.courseId)
  }
  return assignment
}

export async function deleteAssignment(id: string) {
  const [assignment] = await db
    .delete(AssignmentTable)
    .where(eq(AssignmentTable.id, id))
    .returning()
  if (assignment?.courseId) {
    await recalculateCourseXp(assignment.courseId)
  }
  return assignment
}

export async function getAssignmentById(id: string) {
  return db.query.AssignmentTable.findFirst({
    where: eq(AssignmentTable.id, id),
    with: {
      course: true,
      section: true,
    },
  })
}

export async function getAssignmentsByCourse(courseId: string) {
  return db.query.AssignmentTable.findMany({
    where: eq(AssignmentTable.courseId, courseId),
    orderBy: [asc(AssignmentTable.order), asc(AssignmentTable.createdAt)],
    with: {
      section: true,
    },
  })
}

export async function getPublishedAssignmentsByCourse(courseId: string) {
  return db.query.AssignmentTable.findMany({
    where: and(
      eq(AssignmentTable.courseId, courseId),
      eq(AssignmentTable.status, "published")
    ),
    orderBy: [asc(AssignmentTable.order), asc(AssignmentTable.createdAt)],
    with: {
      section: true,
    },
  })
}

// Submission operations
export async function insertSubmission(data: typeof AssignmentSubmissionTable.$inferInsert) {
  const [submission] = await db.insert(AssignmentSubmissionTable).values(data).returning()
  return submission
}

export async function updateSubmission(id: string, data: Partial<typeof AssignmentSubmissionTable.$inferInsert>) {
  const [submission] = await db
    .update(AssignmentSubmissionTable)
    .set(data)
    .where(eq(AssignmentSubmissionTable.id, id))
    .returning()
  return submission
}

export async function getSubmissionById(id: string) {
  return db.query.AssignmentSubmissionTable.findFirst({
    where: eq(AssignmentSubmissionTable.id, id),
    with: {
      assignment: {
        with: {
          course: true,
        },
      },
      user: true,
      grader: true,
    },
  })
}

export async function getSubmissionsByAssignment(assignmentId: string) {
  return db.query.AssignmentSubmissionTable.findMany({
    where: eq(AssignmentSubmissionTable.assignmentId, assignmentId),
    orderBy: [desc(AssignmentSubmissionTable.submittedAt)],
    with: {
      user: true,
      grader: true,
    },
  })
}

export async function getSubmissionsByUser(userId: string) {
  return db.query.AssignmentSubmissionTable.findMany({
    where: eq(AssignmentSubmissionTable.userId, userId),
    orderBy: [desc(AssignmentSubmissionTable.submittedAt)],
    with: {
      assignment: {
        with: {
          course: true,
        },
      },
    },
  })
}

export async function getUserSubmissionForAssignment(userId: string, assignmentId: string) {
  return db.query.AssignmentSubmissionTable.findFirst({
    where: and(
      eq(AssignmentSubmissionTable.userId, userId),
      eq(AssignmentSubmissionTable.assignmentId, assignmentId)
    ),
  })
}

export async function gradeSubmission(
  id: string,
  score: number,
  feedback: string | undefined,
  gradedBy: string
) {
  const [submission] = await db
    .update(AssignmentSubmissionTable)
    .set({
      score,
      feedback,
      gradedBy,
      gradedAt: new Date(),
      status: "graded",
    })
    .where(eq(AssignmentSubmissionTable.id, id))
    .returning()
  return submission
}
