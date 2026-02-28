import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

/**
 * Alias route: /certificates/[id] -> /credentials/[id]
 *
 * The bounty references /certificates/[id] but the canonical credential
 * viewer lives at /credentials/[assetId]. This server component performs
 * a permanent redirect so both URLs resolve correctly.
 */
export default async function CertificateRedirectPage({ params }: PageProps) {
  const { locale, id } = await params;
  redirect(`/${locale}/credentials/${id}`);
}
