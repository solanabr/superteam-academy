"use client"

import { Button } from "@/components/ui/button"
import { FileIcon, ExternalLinkIcon, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type SubmissionFileViewerProps = {
  submissionId: string
  fileName: string
}

export function SubmissionFileViewer({
  submissionId,
  fileName,
}: SubmissionFileViewerProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleViewFile() {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/submissions/${submissionId}/download`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get download URL")
      }

      // Open the signed URL in a new tab
      window.open(data.url, "_blank")
    } catch (error) {
      console.error("Error getting download URL:", error)
      toast.error("Failed to open file. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
      <FileIcon className="h-5 w-5 flex-shrink-0" />
      <span className="flex-1 truncate">{fileName}</span>
      <Button
        variant="outline"
        size="sm"
        onClick={handleViewFile}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <ExternalLinkIcon className="h-4 w-4 mr-1" />
            View
          </>
        )}
      </Button>
    </div>
  )
}
