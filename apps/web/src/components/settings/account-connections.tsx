'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Mail, Github, Link2, Unlink } from 'lucide-react';
import { mockUserSettings } from '@/lib/mock-data';

export function AccountConnections() {
  const t = useTranslations('settingsPage');

  const { account } = mockUserSettings;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('connectedAccounts')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wallet */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-solana-purple" />
            <div>
              <p className="text-sm font-medium">{t('walletAddress')}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {account.walletAddress.slice(0, 8)}...{account.walletAddress.slice(-6)}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-solana-green border-solana-green/30">
            <Link2 className="mr-1 h-3 w-3" />
            {t('connected')}
          </Badge>
        </div>

        {/* Google */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Google</p>
              <p className="text-xs text-muted-foreground">{account.googleEmail}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1">
            <Unlink className="h-3 w-3" />
            {t('unlink')}
          </Button>
        </div>

        {/* GitHub */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <Github className="h-5 w-5" />
            <div>
              <p className="text-sm font-medium">GitHub</p>
              <p className="text-xs text-muted-foreground">@{account.githubUsername}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1">
            <Unlink className="h-3 w-3" />
            {t('unlink')}
          </Button>
        </div>

        {/* Notification email */}
        <div className="space-y-2 pt-2 border-t">
          <Label htmlFor="notif-email">{t('notificationEmail')}</Label>
          <Input id="notif-email" defaultValue={account.notificationEmail} type="email" />
        </div>
      </CardContent>
    </Card>
  );
}
