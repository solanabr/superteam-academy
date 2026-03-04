"use client";

import { Button } from "@/components/ui/button";
import { FileText, Trash2, Download, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface CourseFile {
  id: string;
  name: string;
  description?: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
  status: string;
  order: number;
}

interface CourseFilesListProps {
  courseId: string;
  files: CourseFile[];
}

export function CourseFilesList({ courseId, files }: CourseFilesListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return "text-red-500";
      case "pptx":
      case "ppt":
        return "text-orange-500";
      case "docx":
      case "doc":
        return "text-blue-500";
      case "xlsx":
      case "xls":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    setDeletingId(fileId);

    try {
      const response = await fetch(
        `/api/courses/${courseId}/files/${fileId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      toast.success("File deleted successfully");
      window.location.reload(); // Reload to refresh the list
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete file");
    } finally {
      setDeletingId(null);
    }
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p>No files uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <FileText className={`w-8 h-8 flex-shrink-0 ${getFileIcon(file.fileType)}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {file.name}
                </h3>
                {file.status === "private" ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-green-500" />
                )}
              </div>
              {file.description && (
                <p className="text-sm text-gray-600 truncate">
                  {file.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span>{file.fileName}</span>
                <span>•</span>
                <span>{formatFileSize(file.fileSize)}</span>
                <span>•</span>
                <span className="capitalize">{file.status}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                window.open(
                  `/api/courses/${courseId}/files/${file.id}/download`,
                  "_blank"
                )
              }
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDelete(file.id)}
              disabled={deletingId === file.id}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}