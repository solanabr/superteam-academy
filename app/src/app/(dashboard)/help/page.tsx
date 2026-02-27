'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, BookOpen, MessageSquare, Mail, ShieldCheck } from 'lucide-react';
import { useTranslation } from '@/hooks';

export default function HelpPage() {
  const { t } = useTranslation();
  return (
    <div className="container max-w-5xl space-y-8 py-8">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <HelpCircle className="text-primary h-7 w-7" />
          {t('helpPage.title')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('helpPage.subtitle')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t('helpPage.resourcesTitle')}
            </CardTitle>
            <CardDescription>{t('helpPage.resourcesDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span>{t('dashboard.exploreCourses')}</span>
              <Button variant="outline" size="sm" asChild>
                <Link href="/discover">{t('helpPage.open')}</Link>
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span>{t('helpPage.communityDiscussions')}</span>
              <Button variant="outline" size="sm" asChild>
                <Link href="/community">{t('helpPage.open')}</Link>
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span>{t('nav.notifications')}</span>
              <Button variant="outline" size="sm" asChild>
                <Link href="/notifications">{t('helpPage.open')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t('helpPage.contactSupport')}
            </CardTitle>
            <CardDescription>{t('helpPage.contactDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              {t('helpPage.contactInstructions')}
            </div>
            <Button className="w-full" asChild>
              <a href="mailto:support@capysolbuild.com?subject=CapySolBuild%20Support%20Request">
                <Mail className="mr-2 h-4 w-4" />
                {t('helpPage.emailSupport')}
              </a>
            </Button>
            <div className="text-muted-foreground text-xs">{t('helpPage.responseTime')}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            {t('helpPage.securityTitle')}
          </CardTitle>
          <CardDescription>{t('helpPage.securityDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{t('helpPage.tip')}</Badge>
            {t('helpPage.tipSeedPhrase')}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{t('helpPage.tip')}</Badge>
            {t('helpPage.tipVerifySettings')}{' '}
            <Link className="text-primary underline" href="/settings">
              {t('nav.settings')}
            </Link>
            .
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{t('helpPage.tip')}</Badge>
            {t('helpPage.tipOfficialLinks')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
