import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const challenge = await prisma.challenge.findUnique({
    where: { id },
    select: { solution: true },
  });

  if (!challenge) {
    return NextResponse.json(
      { error: "Challenge not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ solution: challenge.solution });
}
