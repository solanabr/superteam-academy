/**
 * Teacher area entry point — placeholder.
 *
 * The prior CRUD authoring surface (`/teach/courses/*`) was removed in
 * PR-2 Task 5. A read-only viewer replaces it in Task 6.
 */
export default async function TeachPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  return <></>;
}
