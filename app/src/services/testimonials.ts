import { getAdminClient } from "@/lib/supabase/admin";
import type { Testimonial, TestimonialService } from "./interfaces";

function mapRow(row: Record<string, unknown>): Testimonial {
  const profile = row.profiles as Record<string, unknown> | null;
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: (profile?.display_name as string) ?? "Anonymous",
    avatarUrl: (profile?.avatar_url as string) ?? null,
    role: (row.role as string) ?? null,
    quote: row.quote as string,
    featured: (row.featured as boolean) ?? false,
    featuredOrder: (row.featured_order as number) ?? 0,
    createdAt: row.created_at as string,
  };
}

class SupabaseTestimonialService implements TestimonialService {
  private get db() {
    const client = getAdminClient();
    if (!client) throw new Error("Supabase not configured");
    return client;
  }

  async getFeatured(): Promise<Testimonial[]> {
    const { data } = await this.db
      .from("testimonials")
      .select("*, profiles!inner(display_name, avatar_url)")
      .eq("featured", true)
      .order("featured_order", { ascending: true })
      .limit(10);
    return (data ?? []).map(mapRow);
  }

  async getAll(params: { sort?: "newest" | "oldest" } = {}): Promise<Testimonial[]> {
    const ascending = params.sort === "oldest";
    const { data } = await this.db
      .from("testimonials")
      .select("*, profiles!inner(display_name, avatar_url)")
      .order("created_at", { ascending })
      .limit(100);
    return (data ?? []).map(mapRow);
  }

  async submit(userId: string, data: { quote: string; role?: string }): Promise<void> {
    await this.db.from("testimonials").insert({
      user_id: userId,
      quote: data.quote,
      role: data.role || null,
    });
  }

  async setFeatured(id: string, featured: boolean, order?: number): Promise<void> {
    const update: Record<string, unknown> = { featured };
    if (order !== undefined) update.featured_order = order;
    await this.db.from("testimonials").update(update).eq("id", id);
  }
}

export const testimonialService: TestimonialService = new SupabaseTestimonialService();
