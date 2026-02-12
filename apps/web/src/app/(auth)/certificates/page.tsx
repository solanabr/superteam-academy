'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Award } from 'lucide-react';
import { CertificateCard } from '@/components/certificates/certificate-card';
import { certificates, getCurrentUser } from '@/lib/mock-data';

export default function CertificatesListPage() {
  const t = useTranslations('certificatesPage');
  const user = getCurrentUser();

  // Filter certificates for current user (by name match for mock)
  const userCerts = certificates.filter((c) => c.recipientName === user.displayName);

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('myCredentials')}</h1>
        <p className="text-muted-foreground mt-1">{t('myCredentialsDesc')}</p>
      </div>

      {userCerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <Award className="h-16 w-16 text-muted-foreground/30" />
          <h2 className="text-xl font-semibold">{t('noCertificates')}</h2>
          <p className="text-muted-foreground max-w-md">{t('noCertificatesDesc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {userCerts.map((cert) => (
            <Link key={cert.id} href={`/certificates/${cert.id}`}>
              <CertificateCard certificate={cert} variant="compact" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
