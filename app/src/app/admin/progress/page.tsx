import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { db } from "@/drizzle/db"
import {
  AssignmentSubmissionTable,
  AssignmentTable,
  CourseSectionTable,
  LessonTable,
  UserCourseAccessTable,
  UserLessonCompleteTable,
  UserTable,
} from "@/drizzle/schema"
import { getAssignmentGlobalTag, getSubmissionGlobalTag } from "@/features/quizzes/db/cache/quizzes"
import { getCourseGlobalTag } from "@/features/courses/db/cache/courses"
import { getUserCourseAccessGlobalTag } from "@/features/courses/db/cache/userCourseAccess"
import { formatNumber } from "@/lib/formatters"
import { count, countDistinct, eq, isNull } from "drizzle-orm"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import Link from "next/link"
import { ReactNode, Suspense } from "react"
import {
  Users,
  GraduationCap,
  CheckCircle,
  FileText,
  TrendingUp,
  ArrowUpRight,
  BookOpen,
  Target,
} from "lucide-react"

export default async function ProgressDashboardPage() {
  return (
    <div className="min-h-screen">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Progress Tracking
          </h1>
          <p className="text-muted-foreground">
            Monitor student progress across all courses
          </p>
        </div>

        {/* Overview Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Suspense fallback={<StatCardSkeleton count={4} />}>
              <OverviewStats />
            </Suspense>
          </div>
        </div>

        {/* Course Progress */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Course Progress
          </h2>
          <Suspense fallback={<TableSkeleton />}>
            <CourseProgressTable />
          </Suspense>
        </div>

        {/* Student Progress */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Student Progress
          </h2>
          <Suspense fallback={<TableSkeleton />}>
            <StudentProgressTable />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

async function OverviewStats() {
  const [totalStudents, avgCompletion, totalSubmissions, gradedSubmissions] =
    await Promise.all([
      getTotalEnrolledStudents(),
      getAverageCompletion(),
      getTotalSubmissions(),
      getGradedSubmissions(),
    ])

  return (
    <>
      <AnimatedStatCard title="Enrolled Students" icon={Users}>
        {formatNumber(totalStudents)}
      </AnimatedStatCard>
      <AnimatedStatCard title="Avg Completion" icon={Target}>
        {avgCompletion.toFixed(1)}%
      </AnimatedStatCard>
      <AnimatedStatCard title="Submissions" icon={FileText}>
        {formatNumber(totalSubmissions)}
      </AnimatedStatCard>
      <AnimatedStatCard title="Graded" icon={CheckCircle}>
        {formatNumber(gradedSubmissions)}
      </AnimatedStatCard>
    </>
  )
}

async function CourseProgressTable() {
  const courses = await getCourseProgress()

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead>Lessons</TableHead>
              <TableHead>Avg Progress</TableHead>
              <TableHead>Quizzes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No courses yet
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.name}</TableCell>
                  <TableCell>{course.enrolledStudents}</TableCell>
                  <TableCell>{course.totalLessons}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${course.avgProgress}%` }}
                        />
                      </div>
                      <span className="text-sm">{course.avgProgress.toFixed(0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {course.submittedAssignments}/{course.totalAssignments}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/progress/courses/${course.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

async function StudentProgressTable() {
  const students = await getStudentProgress()

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Lessons Completed</TableHead>
              <TableHead>Quizzes</TableHead>
              <TableHead>Avg Score</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No students enrolled yet
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{student.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {student.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{student.enrolledCourses}</TableCell>
                  <TableCell>{student.lessonsCompleted}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {student.submittedAssignments} submitted
                      {student.gradedAssignments > 0 && (
                        <span className="text-muted-foreground">
                          {" "}
                          ({student.gradedAssignments} graded)
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.avgScore !== null ? (
                      <Badge
                        className={
                          student.avgScore >= 70
                            ? "bg-green-500"
                            : student.avgScore >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }
                      >
                        {student.avgScore.toFixed(0)}%
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/progress/students/${student.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

interface AnimatedStatCardProps {
  title: string
  children: ReactNode
  icon: any
}

function AnimatedStatCard({ title, children, icon: Icon }: AnimatedStatCardProps) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#9945FF] to-[#9945FF]" />
      <CardHeader className="relative">
        <div className="flex items-start justify-between mb-2">
          <CardDescription className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {title}
          </CardDescription>
          <div className="p-2 rounded-lg bg-gradient-to-br from-[#9945FF] to-[#9945FF] shadow-lg">
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
        <CardTitle className="text-3xl font-bold">{children}</CardTitle>
      </CardHeader>
    </Card>
  )
}

function StatCardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="relative overflow-hidden border-0">
          <CardHeader>
            <div className="flex items-start justify-between mb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-9 w-28" />
          </CardHeader>
        </Card>
      ))}
    </>
  )
}

function TableSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

// Data fetching functions
async function getTotalEnrolledStudents() {
  "use cache"
  cacheTag(getUserCourseAccessGlobalTag())

  const [data] = await db
    .select({ total: countDistinct(UserCourseAccessTable.userId) })
    .from(UserCourseAccessTable)

  return data?.total ?? 0
}

async function getAverageCompletion() {
  "use cache"
  cacheTag(getUserCourseAccessGlobalTag())

  // Get total lessons and completed lessons across all enrollments
  const [totalLessonsData] = await db
    .select({ count: count(LessonTable.id) })
    .from(LessonTable)

  const [completedLessonsData] = await db
    .select({ count: count(UserLessonCompleteTable.lessonId) })
    .from(UserLessonCompleteTable)

  const totalLessons = totalLessonsData?.count ?? 0
  const completedLessons = completedLessonsData?.count ?? 0

  if (totalLessons === 0) return 0

  // Simple average: total completed / total lessons * 100
  return (completedLessons / totalLessons) * 100
}

async function getTotalSubmissions() {
  "use cache"
  cacheTag(getSubmissionGlobalTag())

  const [data] = await db
    .select({ total: count(AssignmentSubmissionTable.id) })
    .from(AssignmentSubmissionTable)

  return data?.total ?? 0
}

async function getGradedSubmissions() {
  "use cache"
  cacheTag(getSubmissionGlobalTag())

  const [data] = await db
    .select({ total: count(AssignmentSubmissionTable.id) })
    .from(AssignmentSubmissionTable)
    .where(eq(AssignmentSubmissionTable.status, "graded"))

  return data?.total ?? 0
}

async function getCourseProgress() {
  "use cache"
  cacheTag(getCourseGlobalTag(), getAssignmentGlobalTag())

  const courses = await db.query.CourseTable.findMany({
    with: {
      assignments: true,
    },
  })

  const courseProgress = await Promise.all(
    courses.map(async (course) => {
      const [enrolledData] = await db
        .select({ count: count(UserCourseAccessTable.userId) })
        .from(UserCourseAccessTable)
        .where(eq(UserCourseAccessTable.courseId, course.id))

      const [lessonsData] = await db
        .select({ count: count(LessonTable.id) })
        .from(LessonTable)
        .innerJoin(
          CourseSectionTable,
          eq(LessonTable.sectionId, CourseSectionTable.id)
        )
        .where(eq(CourseSectionTable.courseId, course.id))

      const [submissionsData] = await db
        .select({ count: count(AssignmentSubmissionTable.id) })
        .from(AssignmentSubmissionTable)
        .innerJoin(
          AssignmentTable,
          eq(AssignmentSubmissionTable.assignmentId, AssignmentTable.id)
        )
        .where(eq(AssignmentTable.courseId, course.id))

      return {
        id: course.id,
        name: course.name,
        enrolledStudents: enrolledData?.count ?? 0,
        totalLessons: lessonsData?.count ?? 0,
        avgProgress: 0, // Simplified for now
        totalAssignments: course.assignments.length,
        submittedAssignments: submissionsData?.count ?? 0,
      }
    })
  )

  return courseProgress
}

async function getStudentProgress() {
  "use cache"
  cacheTag(getUserCourseAccessGlobalTag(), getSubmissionGlobalTag())

  const students = await db
    .selectDistinct({
      id: UserTable.id,
      name: UserTable.name,
      email: UserTable.email,
    })
    .from(UserTable)
    .innerJoin(
      UserCourseAccessTable,
      eq(UserTable.id, UserCourseAccessTable.userId)
    )
    .where(isNull(UserTable.deletedAt))
    .limit(50)

  const studentProgress = await Promise.all(
    students.map(async (student) => {
      const [enrolledCourses] = await db
        .select({ count: count(UserCourseAccessTable.courseId) })
        .from(UserCourseAccessTable)
        .where(eq(UserCourseAccessTable.userId, student.id))

      const [lessonsCompleted] = await db
        .select({ count: count(UserLessonCompleteTable.lessonId) })
        .from(UserLessonCompleteTable)
        .where(eq(UserLessonCompleteTable.userId, student.id))

      const submissions = await db
        .select({
          status: AssignmentSubmissionTable.status,
          score: AssignmentSubmissionTable.score,
          maxScore: AssignmentTable.maxScore,
        })
        .from(AssignmentSubmissionTable)
        .innerJoin(
          AssignmentTable,
          eq(AssignmentSubmissionTable.assignmentId, AssignmentTable.id)
        )
        .where(eq(AssignmentSubmissionTable.userId, student.id))

      const gradedSubmissions = submissions.filter((s) => s.status === "graded")
      const avgScore =
        gradedSubmissions.length > 0
          ? gradedSubmissions.reduce(
              (sum, s) => sum + ((s.score ?? 0) / s.maxScore) * 100,
              0
            ) / gradedSubmissions.length
          : null

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        enrolledCourses: enrolledCourses?.count ?? 0,
        lessonsCompleted: lessonsCompleted?.count ?? 0,
        submittedAssignments: submissions.length,
        gradedAssignments: gradedSubmissions.length,
        avgScore,
      }
    })
  )

  return studentProgress
}
