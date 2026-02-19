// app/src/app/api/user/sync/route.ts
import { NextResponse } from "next/server";
import { syncUser } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json();
    
    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet required" }, { status: 400 });
    }

    const user = await syncUser(walletAddress);
    return NextResponse.json(user);

  } catch (error) {
    console.error("Sync user error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}