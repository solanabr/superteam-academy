"use client"

import { ActionButton } from "@/components/ActionButton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatPlural } from "@/lib/formatters"
import { Trash2Icon, FileTextIcon } from "lucide-react"
import Link from "next/link"
import { deleteAssignment } from "../actions/quizzes"
import { AssignmentStatus } from "@/drizzle/schema/assignment"

type Quiz = {
  id: string
  name: string
  status: AssignmentStatus
  dueDate: Date | null
  maxScore: number
  section: { name: string } | null
  submissionsCount?: number
}

export function QuizTable({
  quizzes,
  courseId,
}: {
  quizzes: Quiz[]
  courseId: string
}) {
  const getStatusColor = (status: AssignmentStatus) => {
    switch (status) {
      case "published":
        return "bg-green-500"
      case "draft":
        return "bg-yellow-500"
      case "closed":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatDueDate = (date: Date | null) => {
    if (!date) return "No due date"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            {formatPlural(quizzes.length, {
              singular: "quiz",
              plural: "quizzes",
            })}
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Max Score</TableHead>
          <TableHead>Submissions</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quizzes.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              No quizzes yet. Create your first quiz.
            </TableCell>
          </TableRow>
        ) : (
          quizzes.map((quiz) => (
            <TableRow key={quiz.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="font-semibold">{quiz.name}</div>
                  {quiz.section && (
                    <div className="text-muted-foreground text-sm">
                      Section: {quiz.section.name}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(quiz.status)}>
                  {quiz.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {formatDueDate(quiz.dueDate)}
              </TableCell>
              <TableCell>{quiz.maxScore}</TableCell>
              <TableCell>{quiz.submissionsCount ?? 0}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button asChild size="sm">
                    <Link href={`/admin/courses/${courseId}/quizzes/${quiz.id}/edit`}>
                      Edit
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/courses/${courseId}/quizzes/${quiz.id}/submissions`}>
                      <FileTextIcon className="h-4 w-4 mr-1" />
                      Submissions
                    </Link>
                  </Button>
                  <ActionButton
                    variant="destructiveOutline"
                    size="sm"
                    requireAreYouSure
                    action={deleteAssignment.bind(null, quiz.id, courseId)}
                  >
                    <Trash2Icon className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </ActionButton>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
