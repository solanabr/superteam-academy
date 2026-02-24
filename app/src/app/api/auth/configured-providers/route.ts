import { NextResponse } from "next/server";
import { configuredProviders } from "@/lib/auth/config";

export async function GET() {
  return NextResponse.json(configuredProviders);
}
