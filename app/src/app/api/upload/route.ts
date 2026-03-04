// import { NextRequest, NextResponse } from "next/server";
// import { getCurrentUser } from "@/lib/current-user";
// import { canCreateCourses } from "@/features/courses/permissions/courses";
// import { uploadToR2, generateStorageKey } from "@/lib/r2";

// export const dynamic = 'force-dynamic';
// export const runtime = 'nodejs';

// export async function POST(request: NextRequest) {
//   try {
//     const user = await getCurrentUser();
    
//     if (!user || !canCreateCourses(user)) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     const formData = await request.formData();
//     const file = formData.get("file") as File;
//     const courseId = formData.get("courseId") as string;

//     if (!file) {
//       return NextResponse.json(
//         { error: "No file provided" },
//         { status: 400 }
//       );
//     }

//     if (!courseId) {
//       return NextResponse.json(
//         { error: "Course ID is required" },
//         { status: 400 }
//       );
//     }

//     const maxSize = 50 * 1024 * 1024; // 50MB
//     if (file.size > maxSize) {
//       return NextResponse.json(
//         { error: "File size must be less than 50MB" },
//         { status: 400 }
//       );
//     }

//     const allowedTypes = [
//       "application/pdf",
//       "application/vnd.ms-powerpoint",
//       "application/vnd.openxmlformats-officedocument.presentationml.presentation",
//       "application/msword",
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//       "application/vnd.ms-excel",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//       "application/zip",
//     ];

//     if (!allowedTypes.includes(file.type)) {
//       return NextResponse.json(
//         { error: "Invalid file type" },
//         { status: 400 }
//       );
//     }

//     const buffer = Buffer.from(await file.arrayBuffer());

//     const key = generateStorageKey(courseId, file.name);

//     const url = await uploadToR2(buffer, key, file.type);

//     return NextResponse.json({
//       success: true,
//       url,
//       key,
//       fileName: file.name,
//       fileSize: file.size,
//       fileType: file.type,
//     });
//   } catch (error) {
//     console.error("Upload error:", error);
//     return NextResponse.json(
//       { error: "Failed to upload file" },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { canCreateCourses } from "@/features/courses/permissions/courses";
import { r2Client, generateStorageKey } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !canCreateCourses(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, fileType, fileSize, courseId } = await request.json();

    // Validations (Size, Type, etc.)
    if (fileSize > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const key = generateStorageKey(courseId, fileName);

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: fileType,
    });

    // Generate a URL that expires in 60 seconds
    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 60 });

    return NextResponse.json({
      signedUrl,
      key,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate upload link" }, { status: 500 });
  }
}