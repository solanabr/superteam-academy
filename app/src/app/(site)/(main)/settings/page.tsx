'use client';

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
// Simple Mock Tabs if Shadcn not fully set up yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SimpleTabs = ({ children, defaultValue }: any) => {
    const [active, setActive] = useState(defaultValue);
    return (
        <div className="w-full">
            <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {children[0].props.children.map((child: any) => (
                    <button
                        key={child.props['data-value']}
                        onClick={() => setActive(child.props['data-value'])}
                        className={`px-4 py-2 text-sm font-medium transition-colors relative ${active === child.props['data-value']
                            ? 'text-green-500 border-b-2 border-green-500'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        {child.props.children}
                    </button>
                ))}
            </div>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {children.map((child: any) => {
                if (child.type === 'div' && child.props['data-value'] !== active) return null;
                return child;
            })}
        </div>
    )
}

export default function SettingsPage() {
    const { theme, toggleTheme } = useTheme();
    const { lang: language, setLang: setLanguage, t } = useLang();
    const { user, logout } = useAuth();

    const [notifications, setNotifications] = useState({
        email: true,
        push: false,
        marketing: false
    });

    return (
        <div className="container max-w-4xl mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">Settings</h1>

            <div className="bg-white dark:bg-gray-950 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 shadow-sm">
                <SimpleTabs defaultValue="profile">
                    {/* Tab Triggers */}
                    <div role="tablist">
                        <div data-value="profile">Profile</div>
                        <div data-value="preferences">Preferences</div>
                        <div data-value="notifications">Notifications</div>
                    </div>

                    {/* Content: Profile */}
                    <div role="tabpanel" data-value="profile" className="mt-4">
                        <div className="space-y-6">
                            <div className="flex items-center gap-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-3xl font-bold text-white shadow-inner">
                                    {user?.displayName?.[0] || 'U'}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold dark:text-white">{user?.displayName || 'Anonymous Builder'}</h2>
                                    <p className="text-gray-500 dark:text-gray-400">{user?.email || 'No email connected'}</p>
                                    <div className="mt-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded inline-block">
                                        Level 5 Explorer
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 max-w-md">
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Display Name</label>
                                    <input
                                        type="text"
                                        defaultValue={user?.displayName || ''}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Wallet Address</label>
                                    <div className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 font-mono text-sm truncate">
                                        {user?.walletAddress || 'Not connected'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content: Preferences */}
                    <div role="tabpanel" data-value="preferences" className="mt-4">
                        <div className="space-y-8">
                            {/* Theme Toggle */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold dark:text-white">Appearance</h3>
                                    <p className="text-sm text-gray-500">Customize how Superteam Academy looks on your device.</p>
                                </div>
                                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                    <button
                                        onClick={() => theme === 'light' && toggleTheme()}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${theme === 'light' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                                    >
                                        Light
                                    </button>
                                    <button
                                        onClick={() => theme === 'dark' && toggleTheme()}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${theme === 'dark' ? 'bg-gray-700 shadow text-white' : 'text-gray-500'}`}
                                    >
                                        Dark
                                    </button>
                                </div>
                            </div>

                            {/* Language Selector */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold dark:text-white">Language</h3>
                                    <p className="text-sm text-gray-500">Select your preferred language for learning.</p>
                                </div>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value as any)}
                                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:text-white outline-none focus:border-green-500"
                                >
                                    <option value="en">English (US)</option>
                                    <option value="id">Bahasa Indonesia</option>
                                    <option value="es">Español</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Content: Notifications */}
                    <div role="tabpanel" data-value="notifications" className="mt-4">
                        <div className="space-y-4">
                            {[
                                { key: 'email', label: 'Email Notifications', desc: 'Receive daily summaries of your progress.' },
                                { key: 'push', label: 'Push Notifications', desc: 'Get notified when you earn an achievement.' },
                                { key: 'marketing', label: 'Marketing Emails', desc: 'Receive news about new courses and features.' },
                            ].map((item) => (
                                <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                    <div>
                                        <h3 className="font-medium dark:text-white">{item.label}</h3>
                                        <p className="text-sm text-gray-500">{item.desc}</p>
                                    </div>
                                    <button
                                        onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof notifications] }))}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${notifications[item.key as keyof typeof notifications] ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${notifications[item.key as keyof typeof notifications] ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </SimpleTabs>
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={logout}
                    className="text-red-500 hover:text-red-700 font-medium px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                >
                    Log Out
                </button>
            </div>
        </div>
    );
}
