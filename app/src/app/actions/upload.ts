"use server";

import { getCurrentUser } from "@/lib/current-user";
import { canCreateCourses } from "@/features/courses/permissions/courses";
import { uploadToR2, generateStorageKey } from "@/lib/r2";

export async function uploadFileAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !canCreateCourses(user)) {
      return { error: "Unauthorized" };
    }

    const file = formData.get("file") as File;
    const courseId = formData.get("courseId") as string;

    if (!file) {
      return { error: "No file provided" };
    }

    if (!courseId) {
      return { error: "Course ID is required" };
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return { error: "File size must be less than 50MB" };
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/zip",
    ];

    if (!allowedTypes.includes(file.type)) {
      return { error: "Invalid file type" };
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate unique key
    const key = generateStorageKey(courseId, file.name);
    
    // Upload to R2
    const url = await uploadToR2(buffer, key, file.type);

    return {
      success: true,
      url,
      key,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return { error: "Failed to upload file" };
  }
}