import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const backendBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/v1";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const adminWallet = request.headers.get("x-admin-wallet")?.trim() ?? "";

  if (!adminWallet) {
    return NextResponse.json(
      { isAdmin: false, error: "Missing admin wallet header" },
      { status: 400 },
    );
  }

  const response = await fetch(
    `${backendBaseUrl}/user/is-admin/${encodeURIComponent(adminWallet)}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { isAdmin: false, error: text || "Admin check failed" },
      { status: response.status },
    );
  }

  const payload = (await response.json()) as { isAdmin?: boolean };
  return NextResponse.json({ isAdmin: payload.isAdmin === true });
}
