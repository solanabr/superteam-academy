import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { walletAddress, answers } = await request.json();

    if (!walletAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.update({
      where: { walletAddress },
      data: {
        hasCompletedOnboarding: true,
        preferences: answers // Сохраняем JSON ответов
      },
    });

    return NextResponse.json({ success: true, user });

  } catch (error: any) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
  }
}