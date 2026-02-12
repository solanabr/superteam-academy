import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function CertificatePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('certificate');

  const explorerUrl = `https://explorer.solana.com/address/${id}?cluster=devnet`;

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">Course: Solana Fundamentals</p>
        <p className="text-muted-foreground">Completed: —</p>
        <p className="mt-4 font-mono text-sm">{id}</p>
        <div className="mt-8 flex justify-center gap-4">
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">{t('verifyOnExplorer')}</Button>
          </a>
          <Button>{t('share')}</Button>
        </div>
      </div>
    </div>
  );
}
