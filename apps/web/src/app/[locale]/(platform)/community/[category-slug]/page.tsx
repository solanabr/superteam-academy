import { notFound } from "next/navigation";
import { CategoryPageClient } from "./category-page-client";
import { createClient } from "@/lib/supabase/server";

interface CategoryPageProps {
  params: Promise<{ "category-slug": string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { "category-slug": slug } = await params;

  const supabase = await createClient();
  const { data: category } = await supabase
    .from("forum_categories")
    .select("id, name, slug, description")
    .eq("slug", slug)
    .single();

  if (!category) notFound();

  return <CategoryPageClient category={category} />;
}
