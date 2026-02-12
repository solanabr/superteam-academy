import { NextResponse } from "next/server";
import { getCoursesFromCms } from "@/lib/cms/sanity-client";

export async function GET(): Promise<NextResponse> {
  const courses = await getCoursesFromCms();
  return NextResponse.json({ courses });
}
