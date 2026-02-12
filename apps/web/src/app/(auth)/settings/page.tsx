'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Link2, Settings2, Shield } from 'lucide-react';
import { ProfileForm } from '@/components/settings/profile-form';
import { AccountConnections } from '@/components/settings/account-connections';
import { PreferencesForm } from '@/components/settings/preferences-form';
import { PrivacyForm } from '@/components/settings/privacy-form';

export default function SettingsPage() {
  const tNav = useTranslations('settings');
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="mb-6 text-3xl font-bold">{tNav('title')}</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{tNav('profile')}</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">{tNav('accounts')}</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">{tNav('preferences')}</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">{tNav('privacy')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm />
        </TabsContent>
        <TabsContent value="account">
          <AccountConnections />
        </TabsContent>
        <TabsContent value="preferences">
          <PreferencesForm />
        </TabsContent>
        <TabsContent value="privacy">
          <PrivacyForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
