'use client';

/**
 * Settings form — profile editing: name, bio, username, avatar picker, social links, privacy.
 * Uses the PUT /api/profile endpoint.
 */

import { useState, useMemo, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { goeyToast } from 'goey-toast';
import {
    Twitter,
    Github,
    Globe,
    Save,
    Loader2,
    CheckCircle,
    AlertCircle,
    RotateCcw,
    Upload,
} from 'lucide-react';

interface ProfileData {
    name: string | null;
    username: string | null;
    bio: string | null;
    avatar_url: string | null;
    social_links: { twitter?: string | null; github?: string | null; website?: string | null } | null;
    is_public: boolean;
}

interface SettingsFormProps {
    profile: ProfileData;
    onSave: (data: ProfileData) => void;
}

/** Preset avatars from public/avatars */
const PRESET_AVATARS = [
    '/avatars/male_avatar1.png',
    '/avatars/female_avatar2.png',
    '/avatars/female_avatar3.png',
    '/avatars/male_avatar4.png',
    '/avatars/female_avatar5.png',
    '/avatars/female_avatar6.png',
    '/avatars/male_avatar7.png',
    '/avatars/male_avatar8.png',
];

export function SettingsForm({ profile, onSave }: SettingsFormProps) {
    const t = useTranslations('settings');

    // Snapshot of original values for cancel/reset
    const original = useMemo(() => ({
        name: profile.name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        avatarUrl: profile.avatar_url || '',
        twitter: profile.social_links?.twitter || '',
        github: profile.social_links?.github || '',
        website: profile.social_links?.website || '',
        isPublic: profile.is_public,
    }), [profile]);

    const [name, setName] = useState(original.name);
    const [username, setUsername] = useState(original.username);
    const [bio, setBio] = useState(original.bio);
    const [avatarUrl, setAvatarUrl] = useState(original.avatarUrl);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [twitter, setTwitter] = useState(original.twitter);
    const [github, setGithub] = useState(original.github);
    const [website, setWebsite] = useState(original.website);
    const [isPublic, setIsPublic] = useState(original.isPublic);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Check if form has been modified
    const isDirty = name !== original.name
        || username !== original.username
        || bio !== original.bio
        || avatarUrl !== original.avatarUrl
        || twitter !== original.twitter
        || github !== original.github
        || website !== original.website
        || isPublic !== original.isPublic;

    const handleCancel = () => {
        setName(original.name);
        setUsername(original.username);
        setBio(original.bio);
        setAvatarUrl(original.avatarUrl);
        setAvatarPreview(null);
        setTwitter(original.twitter);
        setGithub(original.github);
        setWebsite(original.website);
        setIsPublic(original.isPublic);
        setError(null);
        setSuccess(false);
        goeyToast.info('Changes discarded');
    };

    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side preview
        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview(previewUrl);

        // Upload to server
        setUploading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const res = await fetch('/api/profile/avatar', {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Upload failed');
            }
            const { avatar_url } = await res.json();
            setAvatarUrl(avatar_url);
            goeyToast.success('Avatar uploaded!');
        } catch (err) {
            goeyToast.error(err instanceof Error ? err.message : 'Upload failed');
            setError(err instanceof Error ? err.message : 'Upload failed');
            setAvatarPreview(null);
        } finally {
            setUploading(false);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim() || null,
                    username: username.trim() || null,
                    bio: bio.trim() || null,
                    avatar_url: avatarUrl.trim() || null,
                    social_links: {
                        twitter: twitter.trim() || null,
                        github: github.trim() || null,
                        website: website.trim() || null,
                    },
                    is_public: isPublic,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save');
            }

            const updated = await res.json();
            onSave({ ...updated, is_public: isPublic });
            setSuccess(true);
            goeyToast.success('Profile saved successfully!');
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            goeyToast.error(err instanceof Error ? err.message : 'Failed to save');
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const inputClasses = 'w-full px-3.5 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm font-supreme outline-none focus:ring-2 focus:ring-brand-green-emerald/50 focus:border-brand-green-emerald/50 transition-all placeholder:text-muted-foreground/50';
    const labelClasses = 'text-sm font-semibold font-supreme text-foreground mb-1.5 block';

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
                <label className={labelClasses}>{t('profile.name')}</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    placeholder="Your name"
                    className={inputClasses}
                />
            </div>

            {/* Avatar Picker */}
            <div>
                <label className={labelClasses}>{t('profile.avatar')}</label>
                <div className="grid grid-cols-4 gap-3 mb-3">
                    {PRESET_AVATARS.map((src) => (
                        <button
                            key={src}
                            type="button"
                            onClick={() => {
                                setAvatarUrl(src);
                            }}
                            className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${avatarUrl === src
                                ? 'border-brand-green-emerald shadow-md ring-2 ring-brand-green-emerald/30'
                                : 'border-border hover:border-muted-foreground/30'
                                }`}
                        >
                            <Image
                                src={src}
                                alt="Avatar"
                                width={80}
                                height={80}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                            {avatarUrl === src && (
                                <div className="absolute inset-0 flex items-center justify-center bg-brand-green-emerald/20">
                                    <CheckCircle className="w-5 h-5 text-brand-green-emerald drop-shadow-md" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Upload custom avatar */}
                <div className="flex items-center gap-3">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border border-border text-foreground text-xs font-semibold font-supreme hover:bg-muted/80 disabled:opacity-50 transition-all"
                    >
                        {uploading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Upload className="w-3.5 h-3.5" />
                        )}
                        {uploading ? 'Uploading...' : 'Upload custom photo'}
                    </button>
                    {avatarPreview && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-brand-green-emerald">
                            <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>
                <p className="text-xs text-muted-foreground font-supreme mt-1">
                    PNG, JPG, WebP, or GIF — max 2MB
                </p>
            </div>

            <div>
                <label className={labelClasses}>Username</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                    maxLength={30}
                    placeholder="your-username"
                    className={inputClasses}
                />
                <p className="mt-1 text-xs text-muted-foreground font-supreme">
                    Letters, numbers, hyphens, underscores only
                </p>
            </div>

            <div>
                <label className={labelClasses}>{t('profile.bio')}</label>
                <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Tell us about yourself..."
                    className={`${inputClasses} resize-vertical`}
                />
                <p className="mt-1 text-xs text-muted-foreground font-supreme">
                    {bio.length}/500
                </p>
            </div>

            <div>
                <label className={labelClasses}>Social Links</label>
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2.5">
                        <Twitter className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input
                            type="text"
                            value={twitter}
                            onChange={(e) => setTwitter(e.target.value)}
                            placeholder="username"
                            maxLength={200}
                            className={`${inputClasses} flex-1`}
                        />
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Github className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input
                            type="text"
                            value={github}
                            onChange={(e) => setGithub(e.target.value)}
                            placeholder="username"
                            maxLength={200}
                            className={`${inputClasses} flex-1`}
                        />
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input
                            type="url"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            placeholder="https://your-site.com"
                            maxLength={200}
                            className={`${inputClasses} flex-1`}
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2.5">
                <label className="text-sm font-supreme text-foreground flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="w-4 h-4 rounded border-border accent-brand-green-emerald"
                    />
                    Public profile
                </label>
                <span className="text-xs text-muted-foreground font-supreme">
                    Others can see your profile at /profile/{username || 'username'}
                </span>
            </div>

            {error && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-supreme">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-brand-green-emerald/10 border border-brand-green-emerald/20 text-brand-green-emerald text-sm font-supreme">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    Profile saved
                </div>
            )}

            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={saving || !isDirty}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-green-emerald text-white text-sm font-semibold font-supreme shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>

                {isDirty && (
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm font-semibold font-supreme hover:bg-muted/80 transition-all"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}
