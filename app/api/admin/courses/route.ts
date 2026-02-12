import { NextRequest, NextResponse } from "next/server";
import { getCoursesFromCms, getWritableSanityClient } from "@/lib/cms/sanity-client";

export async function GET(): Promise<NextResponse> {
  const courses = await getCoursesFromCms();
  return NextResponse.json({ courses });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const client = getWritableSanityClient();
  if (!client) {
    return NextResponse.json(
      { error: "Missing SANITY_API_TOKEN or Sanity env vars for write operations." },
      { status: 501 }
    );
  }

  const payload = (await request.json()) as Record<string, unknown>;
  const created = await client.create({ _type: "course", ...payload });
  return NextResponse.json({ course: created }, { status: 201 });
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const client = getWritableSanityClient();
  if (!client) {
    return NextResponse.json(
      { error: "Missing SANITY_API_TOKEN or Sanity env vars for write operations." },
      { status: 501 }
    );
  }

  const payload = (await request.json()) as { _id: string } & Record<string, unknown>;
  const { _id, ...rest } = payload;
  const updated = await client.patch(_id).set(rest).commit();
  return NextResponse.json({ course: updated });
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const client = getWritableSanityClient();
  if (!client) {
    return NextResponse.json(
      { error: "Missing SANITY_API_TOKEN or Sanity env vars for write operations." },
      { status: 501 }
    );
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing course id." }, { status: 400 });
  }

  await client.delete(id);
  return NextResponse.json({ deleted: true });
}
