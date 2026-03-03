'use client';

/**
 * Settings page — profile editing, account linking, preferences, privacy.
 * 4 tabs: Profile, Accounts, Preferences, Privacy.
 *
 * Full width layout matching other pages (max-w-3xl).
 * Smooth tab transitions with CSS animation.
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
    User,
    Link2,
    Settings2,
    ShieldCheck,
    Globe,
    Lock,
    Download,
    Loader2,
} from 'lucide-react';
import { SettingsForm } from '@/components/settings/SettingsForm';
import { AccountsManager } from '@/components/settings/AccountsManager';
import { PreferencesPanel } from '@/components/settings/PreferencesPanel';
import { DeleteProfileSection } from '@/components/settings/DeleteProfileSection';
import { useAnalytics } from '@/context/hooks/useAnalytics';
import { goeyToast } from 'goey-toast';

interface ProfileData {
    name: string | null;
    username: string | null;
    bio: string | null;
    avatar_url: string | null;
    social_links: { twitter?: string | null; github?: string | null; website?: string | null } | null;
    is_public: boolean;
}

export default function SettingsPage() {
    const t = useTranslations('settings');
    const { trackPageView, trackEvent } = useAnalytics();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'profile' | 'accounts' | 'preferences' | 'privacy'>('profile');
    const [exporting, setExporting] = useState(false);
    const [exportDone, setExportDone] = useState(false);
    const [animating, setAnimating] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch('/api/profile');
                if (res.ok) {
                    setProfile(await res.json());
                }
            } catch {
                console.error('Failed to load profile');
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, []);

    useEffect(() => {
        trackPageView('/settings');
        trackEvent('view_settings');
    }, [trackPageView, trackEvent]);

    const handleTabChange = (tab: typeof activeTab) => {
        if (tab === activeTab) return;
        setAnimating(true);
        // Brief fade-out, then switch content, then fade-in
        setTimeout(() => {
            setActiveTab(tab);
            setAnimating(false);
        }, 150);
    };

    const handleVisibilityToggle = async (isPublic: boolean) => {
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_public: isPublic }),
            });
            if (res.ok && profile) {
                setProfile({ ...profile, is_public: isPublic });
                goeyToast.success(isPublic ? 'Profile is now public' : 'Profile is now private');
            }
        } catch {
            goeyToast.error('Failed to update visibility');
            console.error('Failed to update visibility');
        }
    };

    const handleExportData = async () => {
        setExporting(true);
        try {
            const res = await fetch('/api/profile');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `superteam-profile-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            setExportDone(true);
            goeyToast.success('Profile data exported!');
            setTimeout(() => setExportDone(false), 3000);
        } catch {
            goeyToast.error('Failed to export data');
            console.error('Failed to export data');
        } finally {
            setExporting(false);
        }
    };

    const tabs = [
        { id: 'profile' as const, label: t('profile.title'), icon: User },
        { id: 'accounts' as const, label: t('account.title'), icon: Link2 },
        { id: 'preferences' as const, label: t('preferences.title'), icon: Settings2 },
        { id: 'privacy' as const, label: t('privacy.title'), icon: ShieldCheck },
    ];

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto space-y-5 px-4 sm:px-0">
                <div className="h-8 w-40 rounded-lg bg-muted animate-pulse" />
                <div className="h-12 rounded-2xl bg-muted animate-pulse" />
                <div className="h-64 rounded-2xl bg-muted animate-pulse" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-5 px-4 sm:px-0">
            <h1 className="text-2xl font-bold font-display text-foreground">
                {t('title')}
            </h1>

            {/* Tab bar — scrollable on mobile, larger touch targets */}
            <div
                className="flex gap-1 p-1 rounded-2xl bg-card border border-border shadow-sm overflow-x-auto"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <style>{`
                    .settings-tabs::-webkit-scrollbar { display: none; }
                `}</style>
                {tabs.map((tab) => {
                    const IconComp = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold font-supreme transition-all duration-200 whitespace-nowrap min-h-[44px] min-w-[44px] flex-1 sm:flex-1 ${isActive
                                ? 'bg-brand-green-emerald text-white shadow-md'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                        >
                            <IconComp className="w-4 h-4 shrink-0" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Content with smooth transition */}
            <div
                ref={contentRef}
                className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm transition-opacity duration-150 ease-in-out"
                style={{ opacity: animating ? 0 : 1 }}
            >
                {activeTab === 'profile' && profile && (
                    <SettingsForm
                        profile={profile}
                        onSave={(updated) => setProfile({ ...profile, ...updated })}
                    />
                )}

                {activeTab === 'accounts' && <AccountsManager />}

                {activeTab === 'preferences' && <PreferencesPanel />}

                {activeTab === 'privacy' && (
                    <div className="flex flex-col gap-6">
                        {/* Profile visibility */}
                        <div>
                            <label className="text-sm font-semibold font-supreme text-foreground mb-3 block">
                                {t('privacy.profileVisibility')}
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleVisibilityToggle(true)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-supreme transition-all border ${profile?.is_public
                                        ? 'bg-brand-green-emerald/10 border-brand-green-emerald/30 text-brand-green-emerald'
                                        : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <Globe className="w-4 h-4" />
                                    {t('privacy.public')}
                                </button>
                                <button
                                    onClick={() => handleVisibilityToggle(false)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-supreme transition-all border ${!profile?.is_public
                                        ? 'bg-red-500/10 border-red-500/30 text-red-500 dark:text-red-400'
                                        : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <Lock className="w-4 h-4" />
                                    {t('privacy.private')}
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground font-supreme">
                                {profile?.is_public
                                    ? `Your profile is visible to anyone at /profile/${profile?.username || 'your-username'}`
                                    : 'Your profile is hidden from other users'}
                            </p>
                        </div>

                        {/* Data export */}
                        <div>
                            <label className="text-sm font-semibold font-supreme text-foreground mb-2 block">
                                {t('privacy.exportData')}
                            </label>
                            <p className="text-xs text-muted-foreground font-supreme mb-3">
                                Download a copy of your profile data as a JSON file.
                            </p>
                            <button
                                onClick={handleExportData}
                                disabled={exporting}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-green-emerald text-white text-sm font-semibold font-supreme shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {exporting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4" />
                                )}
                                {exporting ? 'Exporting...' : exportDone ? 'Downloaded' : 'Export Data'}
                            </button>
                        </div>

                        {/* Danger Zone — Delete Profile */}
                        <div className="border-t border-border pt-6">
                            <h3 className="text-sm font-bold font-supreme text-foreground mb-3">
                                Danger Zone
                            </h3>
                            <DeleteProfileSection />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
