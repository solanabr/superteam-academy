'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

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

interface ProfileFormProps {
    onSubmit: (data: { name: string; username: string; avatar_url: string }) => void;
    isSubmitting: boolean;
}

export function ProfileForm({ onSubmit, isSubmitting }: ProfileFormProps) {
    const t = useTranslations('onboarding');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [checkingUsername, setCheckingUsername] = useState(false);

    const validateUsername = useCallback(async (value: string) => {
        if (!value.trim()) {
            setUsernameError(t('usernameRequired'));
            return false;
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
            setUsernameError(t('usernameInvalid'));
            return false;
        }
        if (value.length > 30) {
            setUsernameError(t('usernameTooLong'));
            return false;
        }

        // Check uniqueness
        setCheckingUsername(true);
        try {
            const res = await fetch(`/api/profile/${encodeURIComponent(value)}`);
            if (res.status === 409) {
                setUsernameError(t('usernameTaken'));
                return false;
            }
        } catch {
            // Network error — allow through, server will validate
        } finally {
            setCheckingUsername(false);
        }

        setUsernameError(null);
        return true;
    }, [t]);

    const handleSubmit = async () => {
        if (!name.trim()) return;
        const isValid = await validateUsername(username);
        if (!isValid) return;

        onSubmit({
            name: name.trim(),
            username: username.trim(),
            avatar_url: selectedAvatar,
        });
    };

    return (
        <div className="text-center">
            <div className="mb-8">
                <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                    {t('profileTitle')}
                </h1>
                <p className="font-supreme text-muted-foreground mt-2 text-base">
                    {t('profileSubtitle')}
                </p>
            </div>

            {/* Avatar picker */}
            <div className="mb-6">
                <label className="block font-supreme text-sm font-medium text-foreground mb-3">
                    {t('chooseAvatar')}
                </label>
                <div className="grid grid-cols-4 gap-3 max-w-xs mx-auto">
                    {PRESET_AVATARS.map((avatar) => (
                        <button
                            key={avatar}
                            onClick={() => setSelectedAvatar(avatar)}
                            className={`relative w-16 h-16 rounded-full overflow-hidden border-3 transition-all duration-200 cursor-pointer ${selectedAvatar === avatar
                                ? 'border-brand-green shadow-md scale-110'
                                : 'border-border hover:border-brand-green/50 opacity-70 hover:opacity-100'
                                }`}
                        >
                            <Image
                                src={avatar}
                                alt="Avatar"
                                fill
                                className="object-cover"
                                sizes="64px"
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* Name field */}
            <div className="mb-4 max-w-sm mx-auto text-left">
                <label htmlFor="onboarding-name" className="block font-supreme text-sm font-medium text-foreground mb-1.5">
                    {t('displayName')}
                </label>
                <input
                    id="onboarding-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('namePlaceholder')}
                    maxLength={100}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-foreground font-supreme text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-all dark:bg-[#1a3d25] dark:border-brand-green/20"
                />
            </div>

            {/* Username field */}
            <div className="mb-6 max-w-sm mx-auto text-left">
                <label htmlFor="onboarding-username" className="block font-supreme text-sm font-medium text-foreground mb-1.5">
                    {t('usernameLabel')}
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-supreme text-sm">@</span>
                    <input
                        id="onboarding-username"
                        type="text"
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                            if (usernameError) setUsernameError(null);
                        }}
                        placeholder={t('usernamePlaceholder')}
                        maxLength={30}
                        className={`w-full pl-8 pr-4 py-2.5 rounded-xl border bg-white text-foreground font-supreme text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all dark:bg-[#1a3d25] ${usernameError
                            ? 'border-red-400 focus:ring-red-400/50 focus:border-red-400'
                            : 'border-border focus:ring-brand-green/50 focus:border-brand-green dark:border-brand-green/20'
                            }`}
                    />
                    {checkingUsername && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="animate-spin h-4 w-4 rounded-full border-2 border-brand-green border-t-transparent" />
                        </div>
                    )}
                </div>
                {usernameError && (
                    <p className="font-supreme text-xs text-red-400 mt-1">{usernameError}</p>
                )}
            </div>

            {/* Submit */}
            <div className="text-center">
                <button
                    id="profile-submit"
                    onClick={handleSubmit}
                    disabled={!name.trim() || !username.trim() || isSubmitting || checkingUsername}
                    className="cta-primary px-10 py-3 rounded-xl font-supreme font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-black" />
                            {t('saving')}
                        </span>
                    ) : (
                        t('continue')
                    )}
                </button>
            </div>
        </div>
    );
}
