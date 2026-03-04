// import { NextRequest, NextResponse } from "next/server";
// import { getCurrentUser } from "@/lib/current-user";
// import { canCreateCourses } from "@/features/courses/permissions/courses";
// import { getPresignedUploadUrl, generateStorageKey } from "@/lib/r2";

// export async function POST(request: NextRequest) {
//   try {
//     const user = await getCurrentUser();
    
//     if (!user || !canCreateCourses(user)) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { fileName, fileType, courseId } = await request.json();

//     const key = generateStorageKey(courseId, fileName);
//     const uploadUrl = await getPresignedUploadUrl(key, fileType);

//     return NextResponse.json({
//       uploadUrl,
//       key,
//       fileUrl: `${process.env.R2_PUBLIC_URL}/${key}`,
//     });
//   } catch (error) {
//     console.error("Get upload URL error:", error);
//     return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { canCreateCourses } from "@/features/courses/permissions/courses";
import { getPresignedUploadUrl, generateStorageKey } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    // Use the sanitized user object from our previous fix
    if (!user || !canCreateCourses(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, fileType, courseId, fileSize } = await request.json();

    // 1. Validate on the server side even though we check on the client
    if (fileSize > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (Max 50MB)" }, { status: 400 });
    }

    if (!courseId || !fileName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Generate the unique key for R2
    const key = generateStorageKey(courseId, fileName);

    // 3. Generate the temporary PUT URL (valid for 60 seconds)
    const uploadUrl = await getPresignedUploadUrl(key, fileType);

    return NextResponse.json({
      uploadUrl,
      key,
      // Ensure your env variable doesn't have a trailing slash
      fileUrl: `${process.env.R2_PUBLIC_URL}/${key}`,
    });
  } catch (error) {
    console.error("Get upload URL error:", error);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}