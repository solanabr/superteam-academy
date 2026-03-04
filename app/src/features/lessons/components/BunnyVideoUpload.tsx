"use client";

import { useState, useCallback } from "react";
import * as tus from "tus-js-client";
import { Upload, X, Video, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BunnyVideoPlayer } from "./BunnyVideoPlayer";

interface BunnyVideoUploadProps {
  onVideoUploaded: (videoId: string) => void;
  existingVideoId?: string;
}

type UploadStatus = "idle" | "creating" | "uploading" | "processing" | "complete" | "error";

export function BunnyVideoUpload({
  onVideoUploaded,
  existingVideoId,
}: BunnyVideoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoId, setVideoId] = useState<string | null>(existingVideoId || null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadInstance, setUploadInstance] = useState<tus.Upload | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Check if it's a video file
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }

    // Max 5GB for Bunny.net
    const maxSize = 5 * 1024 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 5GB");
      return;
    }

    setSelectedFile(file);
    setVideoId(null);
    setUploadStatus("idle");
    setUploadProgress(0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
    }
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  const startUpload = async () => {
    if (!selectedFile) return;

    setUploadStatus("creating");

    try {
      // Step 1: Create video entry in Bunny
      const response = await fetch("/api/bunny/create-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedFile.name.replace(/\.[^/.]+$/, ""), // Remove extension
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create video entry");
      }

      const { videoId: newVideoId, libraryId, authorizationSignature, authorizationExpiration } = await response.json();

      setVideoId(newVideoId);
      setUploadStatus("uploading");

      // Step 2: Upload using TUS protocol
      const upload = new tus.Upload(selectedFile, {
        endpoint: "https://video.bunnycdn.com/tusupload",
        retryDelays: [0, 3000, 5000, 10000, 20000],
        chunkSize: 5 * 1024 * 1024, // 5MB chunks
        metadata: {
          filetype: selectedFile.type,
          title: selectedFile.name,
        },
        headers: {
          AuthorizationSignature: authorizationSignature,
          AuthorizationExpire: String(authorizationExpiration),
          VideoId: newVideoId,
          LibraryId: libraryId,
        },
        onError: (error) => {
          console.error("Upload error:", error);
          setUploadStatus("error");
          toast.error("Upload failed. Please try again.");
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
          setUploadProgress(percentage);
        },
        onSuccess: () => {
          setUploadStatus("complete");
          setUploadProgress(100);
          onVideoUploaded(newVideoId);
          toast.success("Video uploaded successfully! Processing may take a few moments.");
        },
      });

      setUploadInstance(upload);
      upload.start();
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      toast.error("Failed to upload video");
    }
  };

  const cancelUpload = () => {
    if (uploadInstance) {
      uploadInstance.abort();
    }
    setSelectedFile(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    setVideoId(null);
    setUploadInstance(null);
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    setVideoId(null);
    setUploadInstance(null);
  };

  // Show existing video preview
  if (existingVideoId && !selectedFile) {
    return (
      <div className="space-y-4">
        <div className="aspect-video rounded-lg overflow-hidden border">
          <BunnyVideoPlayer videoId={existingVideoId} />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Video ID: {existingVideoId}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setVideoId(null);
              onVideoUploaded("");
            }}
          >
            Replace Video
          </Button>
        </div>
      </div>
    );
  }

  // Show completed upload with preview
  if (uploadStatus === "complete" && videoId) {
    return (
      <div className="space-y-4">
        <div className="aspect-video rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
          <div className="text-center p-4">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
            <p className="font-medium">Video uploaded successfully!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Video is being processed. Preview will be available shortly.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Video ID: {videoId}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={resetUpload}>
            Upload Different Video
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 bg-muted/50"}
          ${uploadStatus !== "idle" && uploadStatus !== "error" ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input
          type="file"
          id="video-upload"
          className="hidden"
          onChange={handleFileChange}
          accept="video/*"
          disabled={uploadStatus !== "idle" && uploadStatus !== "error"}
        />

        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <Video className="w-10 h-10 text-primary" />
              <div className="text-left flex-1 min-w-0">
                <p className="font-semibold truncate">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              {uploadStatus === "idle" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Upload Progress */}
            {(uploadStatus === "creating" || uploadStatus === "uploading") && (
              <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {uploadStatus === "creating"
                    ? "Creating video entry..."
                    : `Uploading... ${uploadProgress}%`}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            {uploadStatus === "idle" && (
              <div className="flex justify-center gap-2">
                <Button type="button" onClick={startUpload}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video
                </Button>
              </div>
            )}

            {uploadStatus === "uploading" && (
              <Button type="button" variant="destructive" onClick={cancelUpload}>
                Cancel Upload
              </Button>
            )}

            {uploadStatus === "error" && (
              <div className="flex justify-center gap-2">
                <Button type="button" variant="outline" onClick={resetUpload}>
                  Clear
                </Button>
                <Button type="button" onClick={startUpload}>
                  Retry Upload
                </Button>
              </div>
            )}
          </div>
        ) : (
          <label htmlFor="video-upload" className="cursor-pointer block">
            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">
              {isDragging ? "Drop video here" : "Drag and drop video"}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse (MP4, MOV, WebM - max 5GB)
            </p>
          </label>
        )}
      </div>

      {/* Live Preview During Upload */}
      {videoId && uploadStatus === "uploading" && (
        <div className="aspect-video rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">
              Preview will appear after processing
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
