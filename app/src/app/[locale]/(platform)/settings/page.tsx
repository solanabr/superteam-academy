'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { Download, Globe, Settings, Share2, User } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { AppearanceSettings } from '@/components/settings/appearance-settings';
import { NotificationSettings } from '@/components/settings/notification-settings';
import { WalletSettings } from '@/components/settings/wallet-settings';
import { AccountLinks } from '@/components/settings/account-links';
import { DangerZone } from '@/components/settings/danger-zone';

const PROFILE_KEY = 'superteam-profile';

interface SocialLinks {
  twitter: string;
  github: string;
  website: string;
}

interface ProfileData {
  displayName: string;
  avatarInitials: string;
  bio: string;
  socialLinks: SocialLinks;
  isPublic: boolean;
  joinDate: string;
}

const defaultProfile: ProfileData = {
  displayName: '',
  avatarInitials: '',
  bio: '',
  socialLinks: {
    twitter: '',
    github: '',
    website: '',
  },
  isPublic: true,
  joinDate: '',
};

function loadProfile(): ProfileData {
  if (typeof window === 'undefined') return defaultProfile;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return defaultProfile;
    const parsed = JSON.parse(raw);
    return {
      ...defaultProfile,
      ...parsed,
      socialLinks: {
        ...defaultProfile.socialLinks,
        ...(parsed.socialLinks ?? {}),
      },
    };
  } catch {
    return defaultProfile;
  }
}

function persistProfile(profile: ProfileData): void {
  try {
    const toSave = { ...profile };
    // Auto-set joinDate on first save if not present
    if (!toSave.joinDate) {
      toSave.joinDate = new Date().toISOString();
    }
    localStorage.setItem(PROFILE_KEY, JSON.stringify(toSave));
  } catch {
    // localStorage quota exceeded or unavailable
  }
}

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0]!;
  if (parts.length === 1) return first.charAt(0).toUpperCase();
  const last = parts[parts.length - 1]!;
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

function collectLocalStorageData(): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith('superteam-')) continue;
      try {
        data[key] = JSON.parse(localStorage.getItem(key)!);
      } catch {
        data[key] = localStorage.getItem(key);
      }
    }
  } catch {
    // localStorage unavailable
  }
  return data;
}

function downloadJson(data: Record<string, unknown>): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `superteam-academy-export-${dateStr}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const { publicKey } = useWallet();
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProfile(loadProfile());
  }, []);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const displayName = e.target.value;
      setProfile((prev) => ({
        ...prev,
        displayName,
        avatarInitials: deriveInitials(displayName),
      }));
      setSaved(false);
    },
    [],
  );

  const handleBioChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const bio = e.target.value.slice(0, 160);
      setProfile((prev) => ({ ...prev, bio }));
      setSaved(false);
    },
    [],
  );

  const handleSocialChange = useCallback(
    (field: keyof SocialLinks) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfile((prev) => ({
          ...prev,
          socialLinks: { ...prev.socialLinks, [field]: e.target.value },
        }));
        setSaved(false);
      },
    [],
  );

  const handleVisibilityChange = useCallback((checked: boolean) => {
    setProfile((prev) => ({ ...prev, isPublic: checked }));
    setSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    persistProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [profile]);

  const handleExportData = useCallback(() => {
    const data = collectLocalStorageData();
    downloadJson(data);
  }, []);

  const initials =
    profile.avatarInitials ||
    (publicKey ? publicKey.toBase58().slice(0, 2).toUpperCase() : 'SA');

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Settings className="size-6" />
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your account preferences and application settings.
        </p>
      </div>

      <Separator />

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            {t('profile')}
          </CardTitle>
          <CardDescription>
            Your display name and avatar across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4">
            <Avatar className="size-16 border-2 border-border">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                {mounted ? initials : ''}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {mounted && profile.displayName
                  ? profile.displayName
                  : 'Anonymous Learner'}
              </p>
              {publicKey && (
                <p className="text-xs font-mono text-muted-foreground">
                  {publicKey.toBase58().slice(0, 8)}&hellip;
                </p>
              )}
            </div>
          </div>

          {/* Display Name Input */}
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              placeholder="Enter your display name"
              value={mounted ? profile.displayName : ''}
              onChange={handleNameChange}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              This name will be visible on the leaderboard and your profile.
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">{t('bio')}</Label>
            <Textarea
              id="bio"
              placeholder={t('bio_placeholder')}
              value={mounted ? profile.bio : ''}
              onChange={handleBioChange}
              maxLength={160}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {mounted ? profile.bio.length : 0}/160
            </p>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Share2 className="size-4" />
              {t('social_links')}
            </Label>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="twitter" className="text-xs text-muted-foreground">
                  {t('twitter')}
                </Label>
                <Input
                  id="twitter"
                  placeholder="https://x.com/username"
                  value={mounted ? profile.socialLinks.twitter : ''}
                  onChange={handleSocialChange('twitter')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="github" className="text-xs text-muted-foreground">
                  {t('github')}
                </Label>
                <Input
                  id="github"
                  placeholder="https://github.com/username"
                  value={mounted ? profile.socialLinks.github : ''}
                  onChange={handleSocialChange('github')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="website" className="text-xs text-muted-foreground">
                  {t('website')}
                </Label>
                <Input
                  id="website"
                  placeholder="https://yoursite.com"
                  value={mounted ? profile.socialLinks.website : ''}
                  onChange={handleSocialChange('website')}
                />
              </div>
            </div>
          </div>

          {/* Profile Visibility Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Globe className="size-4" />
                {t('profile_visibility')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {mounted && profile.isPublic
                  ? t('public_profile')
                  : t('private_profile')}
              </p>
            </div>
            <Switch
              checked={mounted ? profile.isPublic : true}
              onCheckedChange={handleVisibilityChange}
              disabled={!mounted}
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            className="w-full sm:w-auto"
            disabled={!mounted}
          >
            {saved ? 'Saved!' : tCommon('save')}
          </Button>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <AccountLinks />

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="size-5" />
            {t('export_data')}
          </CardTitle>
          <CardDescription>{t('export_data_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleExportData}
            className="gap-2"
            disabled={!mounted}
          >
            <Download className="size-4" />
            {t('export_data')}
          </Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <AppearanceSettings />

      {/* Notifications */}
      <NotificationSettings />

      {/* Wallet */}
      <WalletSettings />

      {/* Danger Zone */}
      <DangerZone />
    </div>
  );
}
