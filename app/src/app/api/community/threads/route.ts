import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const db = getSupabaseAdmin();
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const category = url.searchParams.get("category");
    const courseId = url.searchParams.get("course_id");
    const search = url.searchParams.get("search");
    const offset = (page - 1) * limit;

    let query = db
      .from("threads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== "all") {
      query = query.eq("category", category);
    }
    if (courseId) {
      query = query.eq("course_id", courseId);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      threads: data || [],
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch threads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getSupabaseAdmin();
    const body = await req.json();
    const { title, content, category, courseId, wallet } = body as {
      title?: string;
      content?: string;
      category?: string;
      courseId?: string;
      wallet?: string;
    };

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 401 });
    }
    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const validCategories = ["general", "help", "showcase", "feedback"];
    const threadCategory = validCategories.includes(category || "") ? category : "general";

    const { data, error } = await db
      .from("threads")
      .insert({
        title: title.trim(),
        body: content.trim(),
        author_wallet: wallet,
        course_id: courseId || null,
        category: threadCategory,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ thread: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create thread";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
