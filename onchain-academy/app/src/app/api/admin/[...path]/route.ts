import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const backendBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/v1";

async function proxyAdminRequest(
  request: NextRequest,
  params: { path: string[] },
  method: "GET" | "PATCH",
): Promise<NextResponse> {
  const targetPath = params.path.join("/");
  const url = new URL(`${backendBaseUrl}/admin/${targetPath}`);
  url.search = request.nextUrl.search;

  const adminWallet = request.headers.get("x-admin-wallet");

  const response = await fetch(url.toString(), {
    method,
    headers: {
      "x-admin-token": process.env.ADMIN_TOKEN ?? "dev-admin-token",
      ...(adminWallet ? { "x-admin-wallet": adminWallet } : {}),
      "content-type": "application/json",
    },
    ...(method === "PATCH"
      ? { body: JSON.stringify(await request.json()) }
      : {}),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { error: text || "Admin request failed" },
      { status: response.status },
    );
  }

  const payload = (await response.json()) as unknown;
  return NextResponse.json(payload);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } },
): Promise<NextResponse> {
  return proxyAdminRequest(request, params, "GET");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } },
): Promise<NextResponse> {
  return proxyAdminRequest(request, params, "PATCH");
}
