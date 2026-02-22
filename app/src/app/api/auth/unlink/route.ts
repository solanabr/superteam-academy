import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider } = await request.json();
  
  // Удаляем связь Account
  // @ts-ignore
  await prisma.account.deleteMany({
    where: {
      userId: (session.user as any).id,
      provider: provider
    }
  });
  
  // Очищаем поле в User (например, githubHandle)
  const updateData: any = {};
  if (provider === 'github') updateData.githubHandle = null;
  // if (provider === 'google') ...
  
  await prisma.user.update({
      where: { id: (session.user as any).id },
      data: updateData
  });

  return NextResponse.json({ success: true });
}