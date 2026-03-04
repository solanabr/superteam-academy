import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ user: null }, { status: 404 });
  }

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .eq("is_public", true)
    .single();

  if (!data) {
    return NextResponse.json({ user: null }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      name: data.name,
      username: data.username,
      bio: data.bio ?? "",
      initials: data.initials ?? "SL",
      avatarUrl: data.avatar_url,
      joinDate: data.join_date
        ? new Date(data.join_date).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })
        : "",
      walletAddress: data.wallet_address,
      isPublic: data.is_public ?? true,
      socialLinks: data.social_links ?? {},
    },
  });
}
