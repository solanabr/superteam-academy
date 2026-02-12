'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Twitter, Linkedin, Link2, Download, Share2 } from 'lucide-react';

interface ShareButtonsProps {
  certificateId: string;
  courseName: string;
}

export function ShareButtons({ certificateId, courseName }: ShareButtonsProps) {
  const t = useTranslations('certificatesPage');

  const certUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/certificates/${certificateId}`;
  const twitterText = encodeURIComponent(`I just earned my ${courseName} credential on @SuperteamBR Academy! 🎓 Verified on-chain on @solana\n\n${certUrl}`);
  const linkedinUrl = encodeURIComponent(certUrl);

  function copyLink() {
    void navigator.clipboard.writeText(certUrl);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          {t('shareCredential')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <a href={`https://twitter.com/intent/tweet?text=${twitterText}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full gap-2 justify-start">
            <Twitter className="h-4 w-4" />
            {t('shareTwitter')}
          </Button>
        </a>

        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${linkedinUrl}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full gap-2 justify-start">
            <Linkedin className="h-4 w-4" />
            {t('shareLinkedIn')}
          </Button>
        </a>

        <Button variant="outline" className="w-full gap-2 justify-start" onClick={copyLink}>
          <Link2 className="h-4 w-4" />
          {t('copyLink')}
        </Button>

        <Button variant="outline" className="w-full gap-2 justify-start" disabled>
          <Download className="h-4 w-4" />
          {t('downloadImage')}
        </Button>
      </CardContent>
    </Card>
  );
}
