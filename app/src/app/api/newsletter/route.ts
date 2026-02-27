import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const { email } = body;

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  await prisma.newsletter.upsert({
    where: { email: email.toLowerCase().trim() },
    create: { email: email.toLowerCase().trim() },
    update: {},
  });

  return NextResponse.json({ success: true });
}
