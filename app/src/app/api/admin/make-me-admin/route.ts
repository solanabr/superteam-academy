import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Please sign in first" }, { status: 401 });
  }

  // @ts-ignore
  const userId = session.user.id;

  await prisma.user.update({
    where: { id: userId },
    data: { role: "ADMIN" }
  });

  return NextResponse.json({ success: true, message: "You are now an ADMIN! Re-login might be required for UI updates." });
}