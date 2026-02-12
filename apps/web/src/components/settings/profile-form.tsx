'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Github, Twitter, Globe, Save } from 'lucide-react';
import { mockUserSettings } from '@/lib/mock-data';

export function ProfileForm() {
  const t = useTranslations('settingsPage');
  const tCommon = useTranslations('common');

  const [form, setForm] = useState({
    name: mockUserSettings.profile.name,
    bio: mockUserSettings.profile.bio,
    avatarUrl: mockUserSettings.profile.avatarUrl,
    github: mockUserSettings.profile.github,
    twitter: mockUserSettings.profile.twitter,
    website: mockUserSettings.profile.website,
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('editProfile')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t('displayName')}</Label>
          <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">{t('bioLabel')}</Label>
          <Textarea id="bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatar">{t('avatarUrl')}</Label>
          <Input id="avatar" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://..." />
        </div>

        <div className="space-y-2">
          <Label htmlFor="github" className="flex items-center gap-2">
            <Github className="h-4 w-4" /> GitHub
          </Label>
          <Input id="github" value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="twitter" className="flex items-center gap-2">
            <Twitter className="h-4 w-4" /> Twitter
          </Label>
          <Input id="twitter" value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website" className="flex items-center gap-2">
            <Globe className="h-4 w-4" /> {t('websiteLabel')}
          </Label>
          <Input id="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        </div>

        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          {saved ? t('saved') : tCommon('save')}
        </Button>
      </CardContent>
    </Card>
  );
}
