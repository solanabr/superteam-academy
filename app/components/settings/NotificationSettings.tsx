'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePushNotifications } from '@/context/hooks/usePushNotifications';

const NOTIFICATION_TYPES = [
    { key: 'lesson_complete', label: 'Lesson completed', icon: '📘' },
    { key: 'course_complete', label: 'Course completed', icon: '🎓' },
    { key: 'achievement_unlock', label: 'Achievement unlocked', icon: '🏆' },
    { key: 'credential_issued', label: 'Credential issued', icon: '📜' },
    { key: 'streak_milestone', label: 'Streak milestones', icon: '🔥' },
    { key: 'level_up', label: 'Level up', icon: '⭐' },
    { key: 'reply', label: 'Forum replies', icon: '💬' },
    { key: 'mention', label: 'Mentions', icon: '📣' },
    { key: 'system', label: 'System announcements', icon: '📢' },
] as const;

export function NotificationSettings() {
    const t = useTranslations('settings');
    const { isSupported, permission, subscribe, unsubscribe } = usePushNotifications();

    // Per-type toggles stored locally (could be persisted via API in the future)
    const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        NOTIFICATION_TYPES.forEach((nt) => { initial[nt.key] = true; });
        return initial;
    });

    const handleToggle = (key: string) => {
        setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePushToggle = async () => {
        if (permission === 'granted') {
            await unsubscribe();
        } else {
            await subscribe();
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                    {t('notificationPreferences')}
                </h3>
                <p className="text-gray-400 text-sm">
                    {t('notificationDescription')}
                </p>
            </div>

            {/* Push notification master toggle */}
            {isSupported && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">🔔</span>
                        <div>
                            <p className="text-white font-medium">Push Notifications</p>
                            <p className="text-gray-400 text-xs">
                                {permission === 'granted'
                                    ? 'Enabled — you\'ll receive browser notifications'
                                    : 'Enable to receive real-time browser alerts'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handlePushToggle}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${permission === 'granted' ? 'bg-purple-600' : 'bg-gray-600'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${permission === 'granted' ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            )}

            {/* Per-type toggles */}
            <div className="space-y-2">
                {NOTIFICATION_TYPES.map((nt) => (
                    <div
                        key={nt.key}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-lg">{nt.icon}</span>
                            <span className="text-gray-200 text-sm">{nt.label}</span>
                        </div>
                        <button
                            onClick={() => handleToggle(nt.key)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${toggles[nt.key] ? 'bg-purple-600' : 'bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${toggles[nt.key] ? 'translate-x-5' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
