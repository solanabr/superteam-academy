import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { CourseModel } from "@/lib/db/models/course";
import { uploadJson } from "@/lib/arweave";

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await connectDB();
  const courses = await CourseModel.find({}).lean();
  const results: { courseId: string; status: string; txId?: string }[] = [];

  for (const course of courses) {
    const cid = (course as any).courseId as string;

    if ((course as any).contentTxId) {
      results.push({
        courseId: cid,
        status: "already_uploaded",
        txId: (course as any).contentTxId,
      });
      continue;
    }

    try {
      const content = {
        courseId: cid,
        slug: (course as any).slug,
        title: (course as any).title,
        description: (course as any).description,
        thumbnail: (course as any).thumbnail,
        creator: (course as any).creator,
        difficulty: (course as any).difficulty,
        lessonCount: (course as any).lessonCount,
        challengeCount: (course as any).challengeCount,
        xpTotal: (course as any).xpTotal,
        trackId: (course as any).trackId,
        trackLevel: (course as any).trackLevel,
        duration: (course as any).duration,
        modules: (course as any).modules,
        createdAt: (course as any).createdAt,
      };

      const result = await uploadJson(content, [
        { name: "App-Name", value: "Superteam-Academy" },
        { name: "Content-Kind", value: "course-content" },
        { name: "Course-Id", value: cid },
      ]);

      await CourseModel.findOneAndUpdate(
        { courseId: cid },
        { $set: { contentTxId: result.txId } },
      );

      results.push({ courseId: cid, status: "uploaded", txId: result.txId });
    } catch (err: any) {
      results.push({
        courseId: cid,
        status: `error: ${err?.message ?? "unknown"}`,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    total: courses.length,
    uploaded: results.filter((r) => r.status === "uploaded").length,
    skipped: results.filter((r) => r.status === "already_uploaded").length,
    failed: results.filter((r) => r.status.startsWith("error")).length,
    results,
  });
}
