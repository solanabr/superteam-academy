import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth-adapter";
import { getLinkedStatusForWallet } from "@/lib/server/account-linking";
import { getConfiguredProviders } from "@/lib/server/auth-config";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user || !user.walletAddress) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const linked = getLinkedStatusForWallet(user.walletAddress);
  const providers = getConfiguredProviders();

  return NextResponse.json({ linked, providers });
}
