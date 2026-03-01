import { NextRequest, NextResponse } from "next/server";
import { getCoursesCompletedForWallet } from "@/lib/services/indexing-db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  const { wallet } = await params;
  if (!wallet) {
    return NextResponse.json({ error: "Wallet required" }, { status: 400 });
  }
  const coursesCompleted = await getCoursesCompletedForWallet(wallet);
  return NextResponse.json({ coursesCompleted });
}
