'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { Settings, User } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { AppearanceSettings } from '@/components/settings/appearance-settings';
import { NotificationSettings } from '@/components/settings/notification-settings';
import { WalletSettings } from '@/components/settings/wallet-settings';
import { DangerZone } from '@/components/settings/danger-zone';

const PROFILE_KEY = 'superteam-profile';

interface ProfileData {
  displayName: string;
  avatarInitials: string;
}

const defaultProfile: ProfileData = {
  displayName: '',
  avatarInitials: '',
};

function loadProfile(): ProfileData {
  if (typeof window === 'undefined') return defaultProfile;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return defaultProfile;
    return { ...defaultProfile, ...JSON.parse(raw) };
  } catch {
    return defaultProfile;
  }
}

function persistProfile(profile: ProfileData): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
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

export default function SettingsPage() {
  const t = useTranslations('settings');
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

  const handleSave = useCallback(() => {
    persistProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [profile]);

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
            <div className="flex gap-2">
              <Input
                id="display-name"
                placeholder="Enter your display name"
                value={mounted ? profile.displayName : ''}
                onChange={handleNameChange}
                maxLength={50}
              />
              <Button
                onClick={handleSave}
                size="sm"
                className="shrink-0"
                disabled={!mounted}
              >
                {saved ? 'Saved!' : 'Save'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This name will be visible on the leaderboard and your profile.
            </p>
          </div>
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
