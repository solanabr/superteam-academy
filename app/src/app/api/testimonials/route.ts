import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { testimonialService } from "@/services/testimonials";

export async function GET(req: NextRequest) {
  try {
    const all = req.nextUrl.searchParams.get("all");
    const testimonials = all
      ? await testimonialService.getAll({ sort: "newest" })
      : await testimonialService.getFeatured();
    return NextResponse.json(testimonials);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { quote, role } = await req.json();
  if (!quote?.trim()) {
    return NextResponse.json({ error: "Quote required" }, { status: 400 });
  }

  try {
    await testimonialService.submit(session.user.id, { quote: quote.trim(), role: role?.trim() });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
