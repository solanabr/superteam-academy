import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const supabaseServer = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error("[Profile GET] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate the user via session cookies
    const supabaseServer = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const updates = await request.json();

    const dbUpdates: Record<string, unknown> = {};
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (updates.displayName !== undefined)
      dbUpdates.display_name = updates.displayName;

    // Check username uniqueness before updating
    if (dbUpdates.username) {
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("username", dbUpdates.username as string)
        .neq("id", user.id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 }
        );
      }
    }
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.avatarUrl !== undefined)
      dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.socialLinks !== undefined)
      dbUpdates.social_links = updates.socialLinks;
    if (updates.isPublic !== undefined) dbUpdates.is_public = updates.isPublic;
    if (updates.preferredLanguage !== undefined)
      dbUpdates.preferred_language = updates.preferredLanguage;
    if (updates.theme !== undefined) dbUpdates.theme = updates.theme;

    if (Object.keys(dbUpdates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(dbUpdates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("[Profile Update] Failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error("[Profile Update] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
