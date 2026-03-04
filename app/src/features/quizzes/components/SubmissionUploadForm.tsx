"use client"

import { useState } from "react"
import { Upload, X, FileText, File as FileIcon, Loader2, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { submitAssignment } from "../actions/submissions"
import { useRouter } from "next/navigation"

interface SubmissionUploadFormProps {
  assignmentId: string
  existingSubmission?: {
    id: string
    fileName: string | null
    textContent: string | null
    status: string
  } | null
  onSuccess?: () => void
}

export function SubmissionUploadForm({
  assignmentId,
  existingSubmission,
  onSuccess,
}: SubmissionUploadFormProps) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [textContent, setTextContent] = useState(existingSubmission?.textContent || "")

  const allowedExtensions = ["pdf", "pptx", "ppt", "docx", "doc", "xlsx", "xls", "zip", "jpg", "jpeg", "png"]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error("File size must be less than 50MB")
      return
    }

    const extension = file.name.split(".").pop()?.toLowerCase()

    if (!extension || !allowedExtensions.includes(extension)) {
      toast.error("Invalid file type. Allowed: PDF, PPTX, DOCX, XLSX, ZIP, JPG, PNG")
      return
    }

    setSelectedFile(file)
  }

  const getFileIcon = () => {
    if (!selectedFile) return <FileIcon className="w-8 h-8 text-gray-400" />

    const ext = selectedFile.name.split(".").pop()?.toLowerCase()
    switch (ext) {
      case "pdf":
        return <FileText className="w-8 h-8 text-red-500" />
      case "pptx":
      case "ppt":
        return <FileIcon className="w-8 h-8 text-orange-500" />
      case "docx":
      case "doc":
        return <FileIcon className="w-8 h-8 text-blue-500" />
      case "xlsx":
      case "xls":
        return <FileIcon className="w-8 h-8 text-green-500" />
      case "zip":
        return <FileIcon className="w-8 h-8 text-purple-500" />
      case "jpg":
      case "jpeg":
      case "png":
        return <ImageIcon className="w-8 h-8 text-pink-500" />
      default:
        return <FileIcon className="w-8 h-8 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + " MB"
  }

  const handleSubmit = async () => {
    if (!selectedFile && !textContent.trim()) {
      toast.error("Please upload a file or enter text content")
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      let fileData = {}

      if (selectedFile) {
        // Get presigned URL
        const urlResponse = await fetch("/api/quizzes/get-upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            fileSize: selectedFile.size,
            assignmentId,
          }),
        })

        if (!urlResponse.ok) throw new Error("Failed to get upload URL")
        const { uploadUrl, key, fileUrl } = await urlResponse.json()

        // Upload to R2
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100)
              setUploadProgress(percentComplete)
            }
          })

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response)
            else reject(new Error("Upload to R2 failed"))
          })

          xhr.addEventListener("error", () =>
            reject(new Error("Network error during upload"))
          )

          xhr.open("PUT", uploadUrl)
          xhr.setRequestHeader("Content-Type", selectedFile.type)
          xhr.send(selectedFile)
        })

        fileData = {
          storageKey: key,
          fileUrl: fileUrl,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.name.split(".").pop()?.toLowerCase() || "unknown",
          mimeType: selectedFile.type,
        }
      }

      // Submit quiz
      const result = await submitAssignment({
        assignmentId,
        textContent: textContent.trim() || undefined,
        ...fileData,
      })

      if (result.error) {
        throw new Error(result.message)
      }

      toast.success("Quiz submitted successfully!")
      setSelectedFile(null)
      setTextContent("")
      router.refresh()

      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error("Submission error:", error)
      toast.error(error.message || "Failed to submit quiz")
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const isResubmission = existingSubmission && existingSubmission.status !== "draft"

  return (
    <div className="space-y-6">
      {isResubmission && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            You have already submitted this quiz. Submitting again will replace your previous submission.
          </p>
        </div>
      )}

      <div className="border-2 border-dashed rounded-lg p-8 text-center bg-gray-50">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.zip,.jpg,.jpeg,.png"
          disabled={uploading}
        />

        {selectedFile ? (
          <div className="flex items-center justify-center gap-4">
            {getFileIcon()}
            <div className="text-left flex-1 min-w-0">
              <p className="font-semibold truncate">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            {!uploading && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSelectedFile(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ) : (
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-semibold mb-2">Click to upload file</p>
            <p className="text-sm text-gray-500">
              PDF, PPTX, DOCX, XLSX, ZIP, JPG, or PNG (max 50MB)
            </p>
          </label>
        )}

        {uploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="text-content">Text Response (Optional)</Label>
        <Textarea
          id="text-content"
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="Enter your response here..."
          className="min-h-32 resize-none"
          disabled={uploading}
        />
        <p className="text-sm text-muted-foreground">
          You can submit a file, text response, or both.
        </p>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSelectedFile(null)
            setTextContent("")
          }}
          disabled={uploading}
        >
          Clear
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={uploading || (!selectedFile && !textContent.trim())}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : isResubmission ? (
            "Resubmit Quiz"
          ) : (
            "Submit Quiz"
          )}
        </Button>
      </div>
    </div>
  )
}
