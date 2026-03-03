import { notFound } from "next/navigation";
import { getPayload } from "@/lib/payload";
import { CoursePreview } from "@/components/cms/course-preview";

export default async function CoursePreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const payload = await getPayload();

  const result = await payload.find({
    collection: "courses",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
    draft: true,
  });

  const doc = result.docs[0];
  if (!doc) {
    notFound();
  }

  const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <CoursePreview initialData={doc as any} serverURL={serverURL} />;
}
