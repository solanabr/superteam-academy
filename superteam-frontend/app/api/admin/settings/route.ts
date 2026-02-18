import { NextResponse } from "next/server";
import { checkPermission } from "@/lib/server/admin-auth";
import {
  getPlatformConfig,
  updatePlatformConfig,
  type PlatformConfig,
} from "@/lib/server/admin-store";
import { getAcademyConfigOnChain } from "@/lib/server/academy-chain-read";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const user = await checkPermission("settings.read");
  if (!user) return unauthorized();
  const [platformConfig, chainConfig] = await Promise.all([
    Promise.resolve(getPlatformConfig()),
    getAcademyConfigOnChain(),
  ]);
  return NextResponse.json({ platformConfig, chainConfig });
}

export async function PUT(request: Request) {
  const user = await checkPermission("settings.write");
  if (!user) return unauthorized();
  const body = (await request.json()) as Partial<PlatformConfig>;
  const updated = updatePlatformConfig(body);
  return NextResponse.json(updated);
}
