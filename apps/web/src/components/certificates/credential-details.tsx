'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Shield, CheckCircle2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CertificateData } from '@/lib/mock-data';

interface CredentialDetailsProps {
  certificate: CertificateData;
}

export function CredentialDetails({ certificate }: CredentialDetailsProps) {
  const t = useTranslations('certificatesPage');

  const explorerUrl = `https://explorer.solana.com/address/${certificate.mintAddress}?cluster=devnet`;

  function copyToClipboard(text: string) {
    void navigator.clipboard.writeText(text);
  }

  return (
    <div className="space-y-6">
      {/* Verification Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('onChainVerification')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {certificate.verified ? (
            <Badge className="bg-solana-green/10 text-solana-green border-solana-green/30 gap-1 text-sm py-1 px-3">
              <CheckCircle2 className="h-4 w-4" />
              {t('verifiedOnChain')}
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-sm py-1 px-3 text-yellow-500 border-yellow-500/30">
              {t('pendingVerification')}
            </Badge>
          )}

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-muted-foreground">{t('mintAddress')}</span>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono">{certificate.mintAddress.slice(0, 12)}...</code>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(certificate.mintAddress)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-muted-foreground">{t('metadataUri')}</span>
              <a href={certificate.metadataUri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline text-xs">
                {t('viewMetadata')}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-muted-foreground">{t('tokenStandard')}</span>
              <span className="text-xs">{certificate.tokenStandard}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-muted-foreground">{t('ownerWallet')}</span>
              <code className="text-xs font-mono">{certificate.recipientWallet.slice(0, 12)}...</code>
            </div>
          </div>

          <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full gap-2">
              <ExternalLink className="h-4 w-4" />
              {t('viewOnExplorer')}
            </Button>
          </a>
        </CardContent>
      </Card>

      {/* NFT Attributes */}
      <Card>
        <CardHeader>
          <CardTitle>{t('nftAttributes')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(certificate.attributes).map(([key, value]) => (
              <div key={key} className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                <p className="font-medium text-sm">{String(value)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
