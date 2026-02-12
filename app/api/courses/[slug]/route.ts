import { NextResponse } from "next/server";
import { getCourseBySlugFromCms } from "@/lib/cms/sanity-client";

type Context = {
  params: { slug: string };
};

export async function GET(_: Request, context: Context): Promise<NextResponse> {
  const course = await getCourseBySlugFromCms(context.params.slug);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  return NextResponse.json({ course });
}
