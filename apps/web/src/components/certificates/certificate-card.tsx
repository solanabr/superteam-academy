'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Award, Calendar, QrCode, Shield } from 'lucide-react';
import type { CertificateData } from '@/lib/mock-data';

interface CertificateCardProps {
  certificate: CertificateData;
  variant?: 'full' | 'compact';
}

const levelColors: Record<string, string> = {
  beginner: 'from-green-500/20 to-green-600/5 border-green-500/30',
  intermediate: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30',
  advanced: 'from-red-500/20 to-red-600/5 border-red-500/30',
  expert: 'from-purple-500/20 to-purple-600/5 border-purple-500/30',
};

export function CertificateCard({ certificate, variant = 'full' }: CertificateCardProps) {
  const t = useTranslations('certificatesPage');

  const gradientClass = levelColors[certificate.credentialLevel] ?? levelColors.beginner;
  const date = new Date(certificate.completionDate).toLocaleDateString();

  if (variant === 'compact') {
    return (
      <Card className="overflow-hidden transition-all hover:shadow-lg hover:border-primary/30">
        <CardContent className={`bg-gradient-to-br ${gradientClass} p-6`}>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Award className="h-8 w-8 text-primary" />
              <h3 className="font-bold">{certificate.courseName}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {date}
              </p>
            </div>
            <Badge variant="outline" className="capitalize">{certificate.credentialLevel}</Badge>
          </div>
          <Separator className="my-3" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{certificate.attributes.xpEarned} XP</span>
            {certificate.verified && (
              <span className="flex items-center gap-1 text-solana-green">
                <Shield className="h-3 w-3" />
                {t('verified')}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className={`bg-gradient-to-br ${gradientClass} relative p-8`}>
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <span className="font-bold text-primary">SUPERTEAM BRAZIL</span>
            <span>×</span>
            <span className="font-bold text-solana-purple">SOLANA</span>
          </div>

          <h2 className="text-2xl font-bold">{t('certificateOf')}</h2>

          <div className="space-y-1">
            <p className="text-3xl font-bold bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
              {certificate.courseName}
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t('awardedTo')}</p>
            <p className="text-xl font-semibold">{certificate.recipientName}</p>
          </div>

          <div className="flex justify-center gap-6 text-sm">
            <div>
              <p className="text-muted-foreground">{t('completionDateLabel')}</p>
              <p className="font-medium">{date}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('credentialLevel')}</p>
              <p className="font-medium capitalize">{certificate.credentialLevel}</p>
            </div>
            <div>
              <p className="text-muted-foreground">XP</p>
              <p className="font-medium">{certificate.attributes.xpEarned}</p>
            </div>
          </div>

          <Separator />

          {/* Certificate ID & QR placeholder */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>ID: {certificate.id}</span>
            <div className="flex items-center gap-1">
              <QrCode className="h-4 w-4" />
              <span>{t('scanToVerify')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
