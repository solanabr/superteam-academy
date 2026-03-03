/**
 * MobileStreakLeaderboard — Floating top tab bar (mobile only, hidden on lg+).
 * Two tabs: "Dashboard" (default) and "Streaks & Board".
 * When "Streaks & Board" is selected, parent shows streak + leaderboard instead of dashboard cards.
 */
'use client';

import { useState } from 'react';
import { LayoutDashboard, Flame } from 'lucide-react';
import { DailyLoginStreak } from '@/components/streak/DailyLoginStreak';
import { DashboardLeaderboard } from '@/components/dashboard/DashboardLeaderboard';

type Tab = 'dashboard' | 'streaks';

export function MobileTabBar({ active, onSwitch }: { active: Tab; onSwitch: (t: Tab) => void }) {
    return (
        <div className="lg:hidden flex justify-center mb-4">
            <div
                className="inline-flex items-center gap-1 rounded-full p-1 backdrop-blur-lg shadow-lg"
                style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
            >
                <button
                    onClick={() => onSwitch('dashboard')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold font-supreme transition-all ${active === 'dashboard'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-white/70 hover:text-white'
                        }`}
                >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Home
                </button>
                <button
                    onClick={() => onSwitch('streaks')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold font-supreme transition-all ${active === 'streaks'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-white/70 hover:text-white'
                        }`}
                >
                    <Flame className="w-3.5 h-3.5" />
                    Streaks
                </button>
            </div>
        </div>
    );
}

export function MobileStreaksView() {
    return (
        <div className="space-y-6">
            <DailyLoginStreak />
            <DashboardLeaderboard />
        </div>
    );
}
