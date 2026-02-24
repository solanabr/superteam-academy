import { NextResponse } from "next/server";
import { getSanityWriteClient } from "@/lib/sanity/write-client";
import { isAdminRequest } from "@/lib/auth/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { courseId, title, description, order } = body as {
      courseId?: string;
      title?: string;
      description?: string;
      order?: number;
    };

    if (!courseId || !title) {
      return NextResponse.json(
        { error: "Missing required fields: courseId, title" },
        { status: 400 },
      );
    }

    const sanity = getSanityWriteClient();

    // Create module document
    const module = await sanity.create({
      _type: "module",
      title,
      description: description ?? "",
      order: order ?? 0,
      lessons: [],
    });

    // Append module reference to course.modules array
    await sanity
      .patch(courseId)
      .setIfMissing({ modules: [] })
      .append("modules", [{ _type: "reference", _ref: module._id }])
      .commit();

    return NextResponse.json({
      success: true,
      module: {
        _id: module._id,
        title: module.title,
        description: module.description,
        order: module.order,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to create module";
    console.error("create-module error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
