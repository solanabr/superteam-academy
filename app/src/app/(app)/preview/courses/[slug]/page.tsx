import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { CoursePreviewLoader } from "@/components/cms/course-preview-loader";

export default async function CoursePreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || "";

  // Fetch via REST API to avoid importing the full Payload module tree
  // (which drags @payloadcms/richtext-lexical client components into the
  // SSR bundle, causing a Turbopack "RichText is not defined" error).
  const cookieStore = await cookies();
  const res = await fetch(
    `${serverURL}/cms-api/courses?where[slug][equals]=${slug}&limit=1&depth=2&draft=true`,
    {
      headers: { Cookie: cookieStore.toString() },
      cache: "no-store",
    },
  );

  if (!res.ok) notFound();
  const { docs } = await res.json();
  const doc = docs[0];
  if (!doc) notFound();

  // Normalize populated relationship fields to plain strings for the client component.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializable = doc as any;
  if (serializable.difficulty && typeof serializable.difficulty === "object") {
    const d = serializable.difficulty;
    serializable.difficultyValue = d.value || d.name || d.label || "";
    serializable.difficulty = d.value || d.name || d.label || String(d.id || "");
  }

  return <CoursePreviewLoader initialData={serializable} serverURL={serverURL} />;
}
