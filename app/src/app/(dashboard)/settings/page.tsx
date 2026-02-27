'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { LocationAutocomplete } from '@/components/ui/location-autocomplete';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTranslation } from '@/hooks';
import { useWalletContext, useThemeContext, useAuth } from '@/components/providers';
import { LinkedAccountsSection } from '@/components/settings/LinkedAccountsSection';
import { LogoLoader } from '@/components/ui/logo-loader';
import { NETWORK } from '@/lib/solana/program-config';
import { signOut } from 'next-auth/react';

// Helper function to get user initials
function getUserInitials(name?: string | null): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
import {
  User,
  Bell,
  Globe,
  Palette,
  Shield,
  Wallet,
  Save,
  Camera,
  ExternalLink,
  Check,
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX,
  Mail,
  Smartphone,
  Key,
  Trash2,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { t, locale, setLocale } = useTranslation();
  const { connected, address, walletName } = useWalletContext();
  const { theme, setTheme } = useThemeContext();
  const { user } = useAuth();
  const normalizedNetwork = (NETWORK || 'devnet').toLowerCase();
  const networkLabel =
    normalizedNetwork === 'mainnet' || normalizedNetwork === 'mainnet-beta'
      ? 'Mainnet'
      : normalizedNetwork === 'testnet'
        ? 'Testnet'
        : 'Devnet';
  const environmentLabel =
    normalizedNetwork === 'mainnet' || normalizedNetwork === 'mainnet-beta'
      ? 'Production'
      : 'Development';
  const networkWarningMessage =
    normalizedNetwork === 'mainnet' || normalizedNetwork === 'mainnet-beta'
      ? `You are on ${networkLabel} (${environmentLabel}). Transactions can affect real funds.`
      : `You are on ${networkLabel} (${environmentLabel}). Use this network for development and testing.`;
  const activeWalletAddress = user?.walletAddress || address || null;
  const formattedWalletAddress = activeWalletAddress
    ? `${activeWalletAddress.slice(0, 8)}...${activeWalletAddress.slice(-8)}`
    : 'No wallet connected';
  const activeWalletName = walletName || 'Wallet';

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [telegram, setTelegram] = useState('');
  const [discord, setDiscord] = useState('');
  const [medium, setMedium] = useState('');
  const [youtube, setYoutube] = useState('');
  const [tiktok, setTiktok] = useState('');

  // Loading states
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification states
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [courseUpdates, setCourseUpdates] = useState(true);
  const [streakReminders, setStreakReminders] = useState(true);
  const [leaderboardUpdates, setLeaderboardUpdates] = useState(false);
  const [newChallenges, setNewChallenges] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);

  // Privacy states
  const [profilePublic, setProfilePublic] = useState(true);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const [showActivity, setShowActivity] = useState(true);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/users/profile');
        if (response.ok) {
          const data = await response.json();
          const profileData = data.user;

          // Populate form with existing data
          setFullName(profileData.full_name || '');
          setUsername(profileData.username || '');
          setBio(profileData.bio || '');
          setEmail(profileData.email || '');
          setLocation(profileData.location || '');
          setWebsite(profileData.website || '');
          setTwitter(profileData.twitter || '');
          setGithub(profileData.github || '');
          setLinkedin(profileData.linkedin || '');
          setFacebook(profileData.facebook || '');
          setInstagram(profileData.instagram || '');
          setWhatsapp(profileData.whatsapp || '');
          setTelegram(profileData.telegram || '');
          setDiscord(profileData.discord || '');
          setMedium(profileData.medium || '');
          setYoutube(profileData.youtube || '');
          setTiktok(profileData.tiktok || '');

          setEmailNotifications(profileData.email_notifications ?? true);
          setPushNotifications(profileData.push_notifications ?? true);
          setCourseUpdates(profileData.notification_preferences?.course_updates ?? true);
          setStreakReminders(profileData.notification_preferences?.streak_reminders ?? true);
          setLeaderboardUpdates(profileData.notification_preferences?.leaderboard_updates ?? false);
          setNewChallenges(profileData.notification_preferences?.new_challenges ?? true);

          setProfilePublic(profileData.profile_public ?? true);
          setShowOnLeaderboard(profileData.show_on_leaderboard ?? true);
          setShowActivity(profileData.show_activity ?? true);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (connected && user) {
      fetchProfile();
    }
  }, [connected, user]);

  // Auto-fill from OAuth if available
  useEffect(() => {
    if (user?.name && !fullName) {
      setFullName(user.name);
    }
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, fullName, email]);

  const persistNotificationSettings = async (payload: Record<string, unknown>) => {
    setIsSavingNotifications(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update notification settings');
      }
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const toggleEmailNotifications = async () => {
    const nextValue = !emailNotifications;
    setEmailNotifications(nextValue);
    try {
      await persistNotificationSettings({ email_notifications: nextValue });
    } catch (error) {
      setEmailNotifications(!nextValue);
      toast.error(error instanceof Error ? error.message : 'Failed to update email notifications');
    }
  };

  const togglePushNotifications = async () => {
    const nextValue = !pushNotifications;
    setPushNotifications(nextValue);
    try {
      await persistNotificationSettings({ push_notifications: nextValue });
    } catch (error) {
      setPushNotifications(!nextValue);
      toast.error(error instanceof Error ? error.message : 'Failed to update push notifications');
    }
  };

  const toggleNotificationType = async (
    key: 'course_updates' | 'streak_reminders' | 'leaderboard_updates' | 'new_challenges',
    currentValue: boolean,
    setState: (nextValue: boolean) => void
  ) => {
    const nextValue = !currentValue;
    setState(nextValue);

    try {
      await persistNotificationSettings({
        notification_preferences: {
          course_updates: key === 'course_updates' ? nextValue : courseUpdates,
          streak_reminders: key === 'streak_reminders' ? nextValue : streakReminders,
          leaderboard_updates: key === 'leaderboard_updates' ? nextValue : leaderboardUpdates,
          new_challenges: key === 'new_challenges' ? nextValue : newChallenges,
        },
      });
    } catch (error) {
      setState(currentValue);
      toast.error(error instanceof Error ? error.message : 'Failed to update notification type');
    }
  };

  const persistPrivacySettings = async (payload: Record<string, unknown>) => {
    setIsSavingPrivacy(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update privacy settings');
      }
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const toggleProfilePublic = async () => {
    const nextValue = !profilePublic;
    setProfilePublic(nextValue);
    try {
      await persistPrivacySettings({ profile_public: nextValue });
    } catch (error) {
      setProfilePublic(!nextValue);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile visibility');
    }
  };

  const toggleShowOnLeaderboard = async () => {
    const nextValue = !showOnLeaderboard;
    setShowOnLeaderboard(nextValue);
    try {
      await persistPrivacySettings({ show_on_leaderboard: nextValue });
    } catch (error) {
      setShowOnLeaderboard(!nextValue);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update leaderboard visibility'
      );
    }
  };

  const toggleShowActivity = async () => {
    const nextValue = !showActivity;
    setShowActivity(nextValue);
    try {
      await persistPrivacySettings({ show_activity: nextValue });
    } catch (error) {
      setShowActivity(!nextValue);
      toast.error(error instanceof Error ? error.message : 'Failed to update activity visibility');
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          username,
          bio,
          email,
          location,
          website,
          twitter,
          github,
          linkedin,
          facebook,
          instagram,
          whatsapp,
          telegram,
          discord,
          medium,
          youtube,
          tiktok,
        }),
      });

      if (response.ok) {
        toast.success('Profile updated successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/users/export');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export data');
      }

      // Get the blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `capysolbuild-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/users/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmDelete: 'DELETE_MY_ACCOUNT' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete account');
      }

      toast.success('Account deleted successfully. You will be signed out.');

      // Sign out and redirect to home
      setTimeout(() => {
        signOut({ callbackUrl: '/' });
      }, 2000);
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  if (!connected) {
    return (
      <div className="container py-20">
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <CardTitle>{t('settings.connectWallet')}</CardTitle>
            <CardDescription>{t('settings.connectDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg">{t('common.connectWallet')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('settings.subtitle')}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">{t('settings.profile')}</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden md:inline">{t('settings.appearance')}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden md:inline">{t('settings.notifications')}</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden md:inline">{t('settings.privacy')}</span>
          </TabsTrigger>
          <TabsTrigger value="accounts" className="gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden md:inline">Accounts</span>
          </TabsTrigger>
          <TabsTrigger value="wallet" className="gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden md:inline">{t('settings.wallet')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.profileSettings')}</CardTitle>
              <CardDescription>{t('settings.profileDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingProfile ? (
                <div className="flex items-center justify-center py-12">
                  <LogoLoader size="md" message="Loading profile..." />
                </div>
              ) : (
                <>
                  {/* Avatar */}
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={user?.image || undefined} />
                      <AvatarFallback className="text-2xl">
                        {getUserInitials(fullName || user?.name) ||
                          username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Button variant="outline" className="gap-2">
                        <Camera className="h-4 w-4" />
                        {t('settings.changeAvatar')}
                      </Button>
                      <p className="text-muted-foreground text-xs">{t('settings.avatarHint')}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">
                      Full Name{' '}
                      <span className="text-muted-foreground text-xs">
                        (appears on certificates)
                      </span>
                    </Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                    <p className="text-muted-foreground text-xs">
                      This name will appear on your certificates. Auto-filled from Google/GitHub if
                      connected.
                    </p>
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username">{t('settings.username')}</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t('settings.usernamePlaceholder')}
                    />
                    <p className="text-muted-foreground text-xs">{t('settings.usernameHint')}</p>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">{t('settings.bio')}</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself, your experience with blockchain, and what you're learning..."
                      maxLength={500}
                      rows={5}
                      className="resize-none"
                    />
                    <p className="text-muted-foreground text-xs">
                      {bio.length}/500 {t('settings.characters')}
                    </p>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location">{t('settings.location')}</Label>
                    <LocationAutocomplete
                      id="location"
                      value={location}
                      onChange={setLocation}
                      placeholder="Search for your city (e.g., Agege)"
                    />
                    <p className="text-muted-foreground text-xs">
                      Start typing to search for your location
                    </p>
                  </div>

                  <Separator />

                  {/* Contact & Social Links */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Contact & Social Links</h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                        />
                        <p className="text-muted-foreground text-xs">
                          Auto-filled from Google if connected
                        </p>
                      </div>

                      {/* Website */}
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://yourwebsite.com"
                        />
                      </div>

                      {/* Twitter */}
                      <div className="space-y-2">
                        <Label htmlFor="twitter">Twitter / X</Label>
                        <Input
                          id="twitter"
                          value={twitter}
                          onChange={(e) => setTwitter(e.target.value)}
                          placeholder="@username"
                        />
                      </div>

                      {/* GitHub */}
                      <div className="space-y-2">
                        <Label htmlFor="github">GitHub</Label>
                        <Input
                          id="github"
                          value={github}
                          onChange={(e) => setGithub(e.target.value)}
                          placeholder="username"
                        />
                      </div>

                      {/* LinkedIn */}
                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          placeholder="username or profile URL"
                        />
                      </div>

                      {/* Facebook */}
                      <div className="space-y-2">
                        <Label htmlFor="facebook">Facebook</Label>
                        <Input
                          id="facebook"
                          value={facebook}
                          onChange={(e) => setFacebook(e.target.value)}
                          placeholder="username or profile URL"
                        />
                      </div>

                      {/* Instagram */}
                      <div className="space-y-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          placeholder="@username"
                        />
                      </div>

                      {/* WhatsApp */}
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp</Label>
                        <Input
                          id="whatsapp"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          placeholder="+1234567890"
                        />
                      </div>

                      {/* Telegram */}
                      <div className="space-y-2">
                        <Label htmlFor="telegram">Telegram</Label>
                        <Input
                          id="telegram"
                          value={telegram}
                          onChange={(e) => setTelegram(e.target.value)}
                          placeholder="@username"
                        />
                      </div>

                      {/* Discord */}
                      <div className="space-y-2">
                        <Label htmlFor="discord">Discord</Label>
                        <Input
                          id="discord"
                          value={discord}
                          onChange={(e) => setDiscord(e.target.value)}
                          placeholder="username#0000"
                        />
                      </div>

                      {/* Medium */}
                      <div className="space-y-2">
                        <Label htmlFor="medium">Medium</Label>
                        <Input
                          id="medium"
                          value={medium}
                          onChange={(e) => setMedium(e.target.value)}
                          placeholder="@username"
                        />
                      </div>

                      {/* YouTube */}
                      <div className="space-y-2">
                        <Label htmlFor="youtube">YouTube</Label>
                        <Input
                          id="youtube"
                          value={youtube}
                          onChange={(e) => setYoutube(e.target.value)}
                          placeholder="Channel URL or handle"
                        />
                      </div>

                      {/* TikTok */}
                      <div className="space-y-2">
                        <Label htmlFor="tiktok">TikTok</Label>
                        <Input
                          id="tiktok"
                          value={tiktok}
                          onChange={(e) => setTiktok(e.target.value)}
                          placeholder="@username"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button className="gap-2" onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <LogoLoader size="sm" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          {t('settings.saveChanges')}
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.appearanceSettings')}</CardTitle>
              <CardDescription>{t('settings.appearanceDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme */}
              <div className="space-y-4">
                <h3 className="font-semibold">{t('settings.theme')}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    className="flex h-auto flex-col gap-2 py-4"
                    onClick={() => setTheme('light')}
                  >
                    <Sun className="h-6 w-6" />
                    <span>{t('settings.light')}</span>
                    {theme === 'light' && <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    className="flex h-auto flex-col gap-2 py-4"
                    onClick={() => setTheme('dark')}
                  >
                    <Moon className="h-6 w-6" />
                    <span>{t('settings.dark')}</span>
                    {theme === 'dark' && <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    className="flex h-auto flex-col gap-2 py-4"
                    onClick={() => setTheme('system')}
                  >
                    <Monitor className="h-6 w-6" />
                    <span>{t('settings.system')}</span>
                    {theme === 'system' && <Check className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Language */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Globe className="h-5 w-5" />
                  {t('settings.language')}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={locale === 'en' ? 'default' : 'outline'}
                    className="gap-2"
                    onClick={() => setLocale('en')}
                  >
                    🇺🇸 English
                    {locale === 'en' && <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant={locale === 'pt-br' ? 'default' : 'outline'}
                    className="gap-2"
                    onClick={() => setLocale('pt-br')}
                  >
                    🇧🇷 Português
                    {locale === 'pt-br' && <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant={locale === 'es' ? 'default' : 'outline'}
                    className="gap-2"
                    onClick={() => setLocale('es')}
                  >
                    🇪🇸 Español
                    {locale === 'es' && <Check className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Sound Effects */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="flex items-center gap-2 font-semibold">
                    {soundEffects ? (
                      <Volume2 className="h-5 w-5" />
                    ) : (
                      <VolumeX className="h-5 w-5" />
                    )}
                    {t('settings.soundEffects')}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t('settings.soundEffectsDescription')}
                  </p>
                </div>
                <Button
                  variant={soundEffects ? 'default' : 'outline'}
                  onClick={() => setSoundEffects(!soundEffects)}
                >
                  {soundEffects ? t('settings.on') : t('settings.off')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.notificationSettings')}</CardTitle>
              <CardDescription>{t('settings.notificationDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Channels */}
              <div className="space-y-4">
                <h3 className="font-semibold">{t('settings.notificationChannels')}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="text-muted-foreground h-5 w-5" />
                      <div>
                        <p className="font-medium">{t('settings.emailNotifications')}</p>
                        <p className="text-muted-foreground text-sm">
                          {t('settings.emailNotificationsDesc')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={emailNotifications ? 'default' : 'outline'}
                      size="sm"
                      onClick={toggleEmailNotifications}
                      disabled={isSavingNotifications}
                    >
                      {emailNotifications ? t('settings.on') : t('settings.off')}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="text-muted-foreground h-5 w-5" />
                      <div>
                        <p className="font-medium">{t('settings.pushNotifications')}</p>
                        <p className="text-muted-foreground text-sm">
                          {t('settings.pushNotificationsDesc')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={pushNotifications ? 'default' : 'outline'}
                      size="sm"
                      onClick={togglePushNotifications}
                      disabled={isSavingNotifications}
                    >
                      {pushNotifications ? t('settings.on') : t('settings.off')}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notification Types */}
              <div className="space-y-4">
                <h3 className="font-semibold">{t('settings.notificationTypes')}</h3>
                <div className="space-y-3">
                  {[
                    {
                      key: 'course_updates',
                      labelKey: 'courseUpdates',
                      value: courseUpdates,
                      setter: setCourseUpdates,
                    },
                    {
                      key: 'streak_reminders',
                      labelKey: 'streakReminders',
                      value: streakReminders,
                      setter: setStreakReminders,
                    },
                    {
                      key: 'leaderboard_updates',
                      labelKey: 'leaderboardUpdates',
                      value: leaderboardUpdates,
                      setter: setLeaderboardUpdates,
                    },
                    {
                      key: 'new_challenges',
                      labelKey: 'newChallenges',
                      value: newChallenges,
                      setter: setNewChallenges,
                    },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-2">
                      <span>{t(`settings.${item.labelKey}`)}</span>
                      <Button
                        variant={item.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() =>
                          toggleNotificationType(
                            item.key as
                              | 'course_updates'
                              | 'streak_reminders'
                              | 'leaderboard_updates'
                              | 'new_challenges',
                            item.value,
                            item.setter
                          )
                        }
                        disabled={isSavingNotifications}
                      >
                        {item.value ? t('settings.on') : t('settings.off')}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.privacySettings')}</CardTitle>
              <CardDescription>{t('settings.privacyDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Visibility */}
              <div className="space-y-4">
                <h3 className="font-semibold">{t('settings.profileVisibility')}</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{t('settings.publicProfile')}</p>
                      <p className="text-muted-foreground text-sm">
                        {t('settings.publicProfileDesc')}
                      </p>
                    </div>
                    <Button
                      variant={profilePublic ? 'default' : 'outline'}
                      size="sm"
                      onClick={toggleProfilePublic}
                      disabled={isSavingPrivacy}
                    >
                      {profilePublic ? t('settings.public') : t('settings.private')}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{t('settings.showOnLeaderboard')}</p>
                      <p className="text-muted-foreground text-sm">
                        {t('settings.showOnLeaderboardDesc')}
                      </p>
                    </div>
                    <Button
                      variant={showOnLeaderboard ? 'default' : 'outline'}
                      size="sm"
                      onClick={toggleShowOnLeaderboard}
                      disabled={isSavingPrivacy}
                    >
                      {showOnLeaderboard ? t('settings.on') : t('settings.off')}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{t('settings.showActivity')}</p>
                      <p className="text-muted-foreground text-sm">
                        {t('settings.showActivityDesc')}
                      </p>
                    </div>
                    <Button
                      variant={showActivity ? 'default' : 'outline'}
                      size="sm"
                      onClick={toggleShowActivity}
                      disabled={isSavingPrivacy}
                    >
                      {showActivity ? t('settings.on') : t('settings.off')}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Data Management */}
              <div className="space-y-4">
                <h3 className="font-semibold">{t('settings.dataManagement')}</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={handleExportData}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <LogoLoader size="sm" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        {t('settings.exportData')}
                      </>
                    )}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="text-destructive hover:text-destructive w-full justify-start gap-2"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <LogoLoader size="sm" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                            {t('settings.deleteAccount')}
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Delete Account Permanently?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>
                            This action <strong>cannot be undone</strong>. This will permanently
                            delete your account and all associated data including:
                          </p>
                          <ul className="list-inside list-disc space-y-1 text-sm">
                            <li>Your profile and settings</li>
                            <li>Course progress and enrollments</li>
                            <li>Achievements and certificates</li>
                            <li>Streak history</li>
                            <li>Community posts and comments</li>
                          </ul>
                          <p className="text-muted-foreground text-xs">
                            Note: On-chain credentials (NFTs) will remain on the blockchain as they
                            are immutable.
                          </p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Yes, Delete My Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounts Settings */}
        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle>Linked Accounts</CardTitle>
              <CardDescription>
                Connect multiple authentication methods to your account for easier access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LinkedAccountsSection />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wallet Settings */}
        <TabsContent value="wallet">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.walletSettings')}</CardTitle>
              <CardDescription>{t('settings.walletDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Connected Wallet */}
              <div className="space-y-4">
                <h3 className="font-semibold">{t('settings.connectedWallet')}</h3>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 rounded-full p-2">
                      <Wallet className="text-primary h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-mono text-sm">{formattedWalletAddress}</p>
                      <p className="text-muted-foreground text-xs">{activeWalletName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Check className="h-3 w-3" />
                      {activeWalletAddress ? t('settings.connected') : 'Disconnected'}
                    </Badge>
                    {activeWalletAddress && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`https://explorer.solana.com/address/${activeWalletAddress}?cluster=${normalizedNetwork === 'mainnet' ? 'mainnet-beta' : normalizedNetwork}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* On-Chain Credentials */}
              <div className="space-y-4">
                <h3 className="font-semibold">{t('settings.onChainCredentials')}</h3>
                <div className="bg-muted/50 rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <Key className="text-muted-foreground mt-0.5 h-5 w-5" />
                    <div>
                      <p className="font-medium">{t('settings.credentialsInfo')}</p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {t('settings.credentialsDescription')}
                      </p>
                      <Button variant="link" className="mt-2 px-0" asChild>
                        <a
                          href="https://explorer.solana.com"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t('settings.viewOnExplorer')}
                          <ExternalLink className="ml-1 h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Network */}
              <div className="space-y-4">
                <h3 className="font-semibold">{t('settings.network')}</h3>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span>{networkLabel}</span>
                  </div>
                  <Badge variant="outline">{environmentLabel}</Badge>
                </div>
                <p className="text-muted-foreground flex items-center gap-1 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  {networkWarningMessage}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
