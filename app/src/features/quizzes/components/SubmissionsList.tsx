"use client"

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
import { FileIcon, CheckCircleIcon, ClockIcon } from "lucide-react"
import Link from "next/link"
import { SubmissionStatus } from "@/drizzle/schema/assignmentSubmission"

type Submission = {
  id: string
  status: SubmissionStatus
  submittedAt: Date | null
  score: number | null
  fileName: string | null
  user: {
    id: string
    name: string | null
    email: string | null
  }
}

export function SubmissionsList({
  submissions,
  courseId,
  assignmentId,
  maxScore,
}: {
  submissions: Submission[]
  courseId: string
  assignmentId: string
  maxScore: number
}) {
  const getStatusBadge = (status: SubmissionStatus, score: number | null) => {
    if (status === "graded" && score !== null) {
      return (
        <Badge className="bg-green-500">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Graded: {score}/{maxScore}
        </Badge>
      )
    }
    if (status === "submitted") {
      return (
        <Badge className="bg-blue-500">
          <ClockIcon className="h-3 w-3 mr-1" />
          Pending Review
        </Badge>
      )
    }
    if (status === "returned") {
      return <Badge className="bg-orange-500">Returned</Badge>
    }
    return <Badge className="bg-gray-500">{status}</Badge>
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A"
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
            {formatPlural(submissions.length, {
              singular: "submission",
              plural: "submissions",
            })}
          </TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>File</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {submissions.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              No submissions yet
            </TableCell>
          </TableRow>
        ) : (
          submissions.map((submission) => (
            <TableRow key={submission.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="font-semibold">{submission.user.name ?? "Unknown"}</div>
                  <div className="text-muted-foreground text-sm">
                    {submission.user.email}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {formatDate(submission.submittedAt)}
              </TableCell>
              <TableCell>
                {getStatusBadge(submission.status, submission.score)}
              </TableCell>
              <TableCell>
                {submission.fileName ? (
                  <div className="flex items-center gap-1 text-sm">
                    <FileIcon className="h-4 w-4" />
                    {submission.fileName}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">Text only</span>
                )}
              </TableCell>
              <TableCell>
                <Button asChild size="sm">
                  <Link
                    href={`/admin/courses/${courseId}/quizzes/${assignmentId}/submissions/${submission.id}`}
                  >
                    {submission.status === "graded" ? "View" : "Grade"}
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
