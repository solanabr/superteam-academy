import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";

/**
 * Server metadata for the certificate page (04-08): the page itself is a
 * client component, so the Twitter/OG tags live here. `summary_large_image`
 * is what makes X render the generated certificate card (opengraph-image.tsx)
 * when the learner shares their link.
 */
export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  let title = "Certificate of Completion — Superteam Academy";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anon) {
    try {
      const supabase = createClient(url, anon);
      const { data: cert } = await supabase
        .from("certificates")
        .select("course_title")
        .eq("id", id)
        .single();
      if (cert?.course_title) {
        title = `${cert.course_title} — Certificate of Completion`;
      }
    } catch {
      // Generic title beats a failed unfurl.
    }
  }
  return {
    title,
    description: "On-chain credential issued by Superteam Academy on Solana.",
    twitter: { card: "summary_large_image" },
  };
}

export default function CertificateLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
