import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { checkPermission } from "@/lib/server/admin-auth";
import {
  getPlatformConfig,
  updatePlatformConfig,
  type PlatformConfig,
} from "@/lib/server/admin-store";
import { getAcademyConfigOnChain } from "@/lib/server/academy-chain-read";
import { CacheTags } from "@/lib/server/cache-tags";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const user = await checkPermission("settings.read");
  if (!user) return unauthorized();
  const [platformConfig, chainConfig] = await Promise.all([
    getPlatformConfig(),
    getAcademyConfigOnChain(),
  ]);
  return NextResponse.json({ platformConfig, chainConfig });
}

export async function PUT(request: Request) {
  const user = await checkPermission("settings.write");
  if (!user) return unauthorized();
  const body = (await request.json()) as Partial<PlatformConfig>;
  const updated = await updatePlatformConfig(body);
  revalidateTag(CacheTags.PLATFORM_CONFIG, "max");
  return NextResponse.json(updated);
}
