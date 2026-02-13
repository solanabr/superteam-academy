import { CertificatePageResolver } from '@/components/certificates/certificate-page-resolver';

export default function CertificatePage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { wallet?: string };
}): JSX.Element {
  return (
    <CertificatePageResolver certificateId={params.id} walletHint={searchParams?.wallet} />
  );
}
