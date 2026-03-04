import { redirect } from "next/navigation";

export default async function CertificateRootPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/en/certificates/${id}`);
}
