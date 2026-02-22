import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { walletAddress, username, bio, twitter, github } = body;

    let userToUpdate;

    // Сценарий 1: Пользователь вошел через NextAuth (GitHub/Google)
    if (session?.user) {
      // @ts-ignore - id добавляется в session callback в auth.ts
      const userId = session.user.id;
      userToUpdate = { id: userId };
    } 
    // Сценарий 2: Пользователь вошел только через Кошелек
    else if (walletAddress) {
      userToUpdate = { walletAddress: walletAddress };
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedUser = await prisma.user.update({
      where: userToUpdate,
      data: {
        username,
        bio,
        twitter,
        github,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}