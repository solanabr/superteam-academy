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
  const headers = { Cookie: cookieStore.toString() };
  const res = await fetch(
    `${serverURL}/cms-api/courses?where[slug][equals]=${slug}&limit=1&depth=2&draft=true`,
    { headers, cache: "no-store" },
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
    serializable.difficulty =
      d.value || d.name || d.label || String(d.id || "");
  }

  // Fetch modules and lessons for this course (separate collections)
  const courseId = doc.id;
  const modulesRes = await fetch(
    `${serverURL}/cms-api/modules?where[course][equals]=${courseId}&sort=order&limit=1000&depth=0`,
    { headers, cache: "no-store" },
  );
  const moduleDocs = modulesRes.ok
    ? ((await modulesRes.json()).docs ?? [])
    : [];

  const moduleIds = moduleDocs.map((m: { id: string }) => m.id);
  let lessonDocs: { module: string; [key: string]: unknown }[] = [];
  if (moduleIds.length > 0) {
    const moduleQuery = moduleIds
      .map((id: string) => `where[module][in][]=${id}`)
      .join("&");
    const lessonsRes = await fetch(
      `${serverURL}/cms-api/lessons?${moduleQuery}&sort=order&limit=10000&depth=0`,
      { headers, cache: "no-store" },
    );
    lessonDocs = lessonsRes.ok ? ((await lessonsRes.json()).docs ?? []) : [];
  }

  // Group lessons under their modules
  const lessonsByModule = new Map<string, typeof lessonDocs>();
  for (const lesson of lessonDocs) {
    const modId = String(
      typeof lesson.module === "object"
        ? (lesson.module as { id: string }).id
        : lesson.module,
    );
    if (!lessonsByModule.has(modId)) lessonsByModule.set(modId, []);
    lessonsByModule.get(modId)!.push(lesson);
  }

  const modulesWithLessons = moduleDocs.map(
    (mod: { id: string; [key: string]: unknown }) => ({
      ...mod,
      lessons: lessonsByModule.get(String(mod.id)) ?? [],
    }),
  );

  // Attach modules to the course doc so the preview component can render them
  serializable.modules = modulesWithLessons;

  return (
    <CoursePreviewLoader initialData={serializable} serverURL={serverURL} />
  );
}
