import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { walletAddress, answers } = await request.json();

    if (!walletAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Сохраняем факт прохождения онбординга
    // В реальном проекте ответы (answers) тоже можно сохранить в БД (например, в поле preferences: Json)
    const user = await prisma.user.update({
      where: { walletAddress },
      data: {
        hasCompletedOnboarding: true,
      },
    });

    return NextResponse.json({ success: true, user });

  } catch (error: any) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
  }
}