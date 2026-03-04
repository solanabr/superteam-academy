import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/PageHeader"
import Link from "next/link"
import { CourseTable } from "@/features/courses/components/CourseTable"
import { getCourseGlobalTag } from "@/features/courses/db/cache/courses"
import { db } from "@/drizzle/db"
import {
  AssignmentTable,
  CourseSectionTable,
  CourseTable as DbCourseTable,
  LessonTable,
  UserCourseAccessTable,
} from "@/drizzle/schema"
import { getAssignmentGlobalTag } from "@/features/quizzes/db/cache/quizzes"
import { asc, countDistinct, eq } from "drizzle-orm"
import { getUserCourseAccessGlobalTag } from "@/features/courses/db/cache/userCourseAccess"
import { getCourseSectionGlobalTag } from "@/features/courseSections/db/cache"
import { getLessonGlobalTag } from "@/features/lessons/db/cache/lessons"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { unstable_cache } from "next/cache"

export default async function CoursesPage() {
  return (
    <div className="container my-6">
      <PageHeader title="Courses">
        <Button asChild>
          <Link href="/admin/courses/new">New Course</Link>
        </Button>
      </PageHeader>

      <Suspense fallback={<CourseTableSkeleton />}>
        <CourseTableData />
      </Suspense>
    </div>
  )
}

async function CourseTableData() {
  const courses = await getCourses()
  return <CourseTable courses={courses} />
}

function CourseTableSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead className="text-center">
              <Skeleton className="h-4 w-16 mx-auto" />
            </TableHead>
            <TableHead className="text-center">
              <Skeleton className="h-4 w-16 mx-auto" />
            </TableHead>
            <TableHead className="text-center">
              <Skeleton className="h-4 w-20 mx-auto" />
            </TableHead>
            <TableHead className="w-0">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-5 w-full max-w-xs" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-5 w-8 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-5 w-8 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-5 w-12 mx-auto" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-16 ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

async function getCourses() {
  return unstable_cache(
    async () => {
      return db
        .select({
          id: DbCourseTable.id,
          name: DbCourseTable.name,
          slug: DbCourseTable.slug,
          onchainCourseId: DbCourseTable.onchainCourseId,
          sectionsCount: countDistinct(CourseSectionTable),
          lessonsCount: countDistinct(LessonTable),
          studentsCount: countDistinct(UserCourseAccessTable),
          assignmentsCount: countDistinct(AssignmentTable),
        })
        .from(DbCourseTable)
        .leftJoin(
          CourseSectionTable,
          eq(CourseSectionTable.courseId, DbCourseTable.id)
        )
        .leftJoin(LessonTable, eq(LessonTable.sectionId, CourseSectionTable.id))
        .leftJoin(
          UserCourseAccessTable,
          eq(UserCourseAccessTable.courseId, DbCourseTable.id)
        )
        .leftJoin(
          AssignmentTable,
          eq(AssignmentTable.courseId, DbCourseTable.id)
        )
        .orderBy(asc(DbCourseTable.name))
        .groupBy(DbCourseTable.id)
    },
    ["courses-list"],
    {
      tags: [
        getCourseGlobalTag(),
        getUserCourseAccessGlobalTag(),
        getCourseSectionGlobalTag(),
        getLessonGlobalTag(),
        getAssignmentGlobalTag(),
      ],
      revalidate: false
    }
  )()
}
