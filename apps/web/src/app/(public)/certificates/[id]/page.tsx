'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { CertificateCard } from '@/components/certificates/certificate-card';
import { CredentialDetails } from '@/components/certificates/credential-details';
import { ShareButtons } from '@/components/certificates/share-buttons';
import { certificates } from '@/lib/mock-data';

export default function CertificateViewPage() {
  const t = useTranslations('certificatesPage');
  const params = useParams();
  const id = params.id as string;

  const certificate = certificates.find((c) => c.id === id);

  if (!certificate) {
    return (
      <div className="container flex flex-col items-center justify-center gap-4 py-20">
        <h1 className="text-2xl font-bold">{t('notFound')}</h1>
        <Link href="/certificates">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('backToCertificates')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8">
      <Link href="/certificates" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {t('backToCertificates')}
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main certificate */}
        <div className="lg:col-span-2 space-y-6">
          <CertificateCard certificate={certificate} variant="full" />
          <CredentialDetails certificate={certificate} />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <ShareButtons certificateId={certificate.id} courseName={certificate.courseName} />
        </div>
      </div>
    </div>
  );
}
