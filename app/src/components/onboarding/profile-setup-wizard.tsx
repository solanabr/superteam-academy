'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, Smile } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ProfileSetupWizardProps {
  onComplete: (profile: {
    bio?: string;
    avatar_url?: string;
    website?: string;
    twitter?: string;
    github?: string;
    discord?: string;
  }) => Promise<void>;
  onSkip: () => Promise<void>;
  isLoading?: boolean;
  userName?: string;
}

export function ProfileSetupWizard({
  onComplete,
  onSkip,
  isLoading = false,
  userName = 'User',
}: ProfileSetupWizardProps) {
  const [profile, setProfile] = useState({
    bio: '',
    avatar_url: '',
    website: '',
    twitter: '',
    github: '',
    discord: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        setProfile((prev) => ({
          ...prev,
          avatar_url: result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onComplete(profile);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasAnyField =
    profile.bio ||
    profile.avatar_url ||
    profile.website ||
    profile.twitter ||
    profile.github ||
    profile.discord;

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>
          Help the community get to know you better. You can skip fields you want to leave empty.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col gap-4">
            <Label>Profile Picture</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview || ''} alt="Profile" />
                <AvatarFallback>
                  <Smile className="text-muted-foreground h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <label
                  htmlFor="avatar-upload"
                  className="hover:bg-muted flex w-full cursor-pointer items-center justify-center rounded-lg border border-dashed px-4 py-2 transition"
                >
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">Click to upload or drag and drop</span>
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
                <p className="text-muted-foreground mt-1 text-xs">PNG, JPG up to 2MB</p>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself, your interests, and your goals..."
              value={profile.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              className="min-h-24"
              maxLength={500}
            />
            <p className="text-muted-foreground text-xs">{profile.bio.length}/500 characters</p>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website (optional)</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://yourwebsite.com"
              value={profile.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
            />
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter Handle (optional)</Label>
              <Input
                id="twitter"
                placeholder="@yourhandle"
                value={profile.twitter}
                onChange={(e) => handleInputChange('twitter', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="github">GitHub Username (optional)</Label>
              <Input
                id="github"
                placeholder="yourusername"
                value={profile.github}
                onChange={(e) => handleInputChange('github', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discord">Discord Handle (optional)</Label>
              <Input
                id="discord"
                placeholder="yourdiscord"
                value={profile.discord}
                onChange={(e) => handleInputChange('discord', e.target.value)}
              />
            </div>
          </div>

          {/* Help Text */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 Pro tip: Add your social links so other learners can connect with you and
              collaborate on projects!
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              disabled={isSubmitting || isLoading}
              onClick={() => {
                void onSkip();
              }}
            >
              Skip for now
            </Button>
            <Button type="submit" disabled={!hasAnyField || isSubmitting || isLoading}>
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
