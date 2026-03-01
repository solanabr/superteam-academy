import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { testimonialService } from "@/services/testimonials";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { featured, featuredOrder } = await req.json();

  try {
    await testimonialService.setFeatured(id, featured, featuredOrder);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
