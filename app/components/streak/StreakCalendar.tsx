/**
 * StreakCalendar — GitHub-style monthly activity heatmap.
 */
'use client';

import { type ReactElement } from 'react';
import { useTranslations } from 'next-intl';
import type { StreakDay } from '@/context/types/streak';

interface StreakCalendarProps {
    activity: StreakDay[];
}

export function StreakCalendar({ activity }: StreakCalendarProps) {
    const t = useTranslations('streak');
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const activityMap = new Map<string, StreakDay>();
    activity.forEach((day) => activityMap.set(day.date, day));

    const todayStr = today.toISOString().split('T')[0];

    const days: ReactElement[] = [];

    // Empty cells for alignment
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className="day empty" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        const dayActivity = activityMap.get(dateStr);
        const isToday = dateStr === todayStr;
        const isFuture = date > today;

        let level = 0;
        if (dayActivity) {
            const xp = dayActivity.xpEarned;
            if (xp > 100) level = 4;
            else if (xp > 50) level = 3;
            else if (xp > 25) level = 2;
            else if (xp > 0) level = 1;
        }

        days.push(
            <div
                key={day}
                className={`day ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''} level-${level}`}
                title={dayActivity ? `${dayActivity.xpEarned} XP • ${dayActivity.lessonsCompleted} lessons` : dateStr}
            >
                {day}
            </div>
        );
    }

    const monthName = today.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="streak-calendar">
            <div className="calendar-header">
                <span className="month-name">{monthName}</span>
            </div>

            <div className="calendar-weekdays">
                {t('weekdays').split(',').map((d: string, i: number) => (
                    <div key={`${d}-${i}`} className="weekday">
                        {d}
                    </div>
                ))}
            </div>

            <div className="calendar-grid">{days}</div>

            <div className="calendar-legend">
                <span className="legend-label">{t('less')}</span>
                <div className="legend-colors">
                    <div className="legend-box level-0" />
                    <div className="legend-box level-1" />
                    <div className="legend-box level-2" />
                    <div className="legend-box level-3" />
                    <div className="legend-box level-4" />
                </div>
                <span className="legend-label">{t('more')}</span>
            </div>

            <style jsx>{`
                .streak-calendar {
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 12px;
                }
                .calendar-header {
                    margin-bottom: 12px;
                }
                .month-name {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.7);
                }
                .calendar-weekdays {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 2px;
                    margin-bottom: 4px;
                }
                .weekday {
                    text-align: center;
                    font-size: 0.65rem;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.3);
                    padding: 2px 0;
                }
                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 2px;
                }
                .day {
                    aspect-ratio: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                    font-weight: 500;
                    border-radius: 4px;
                    color: rgba(255, 255, 255, 0.5);
                    transition: all 0.15s;
                }
                .day.empty {
                    background: transparent;
                }
                .day.future {
                    opacity: 0.3;
                }
                .day.today {
                    outline: 1px solid rgba(153, 69, 255, 0.5);
                    outline-offset: -1px;
                    color: rgba(255, 255, 255, 0.9);
                    font-weight: 700;
                }
                .day.level-0 {
                    background: rgba(255, 255, 255, 0.03);
                }
                .day.level-1 {
                    background: rgba(20, 241, 149, 0.15);
                    color: rgba(20, 241, 149, 0.8);
                }
                .day.level-2 {
                    background: rgba(20, 241, 149, 0.3);
                    color: rgba(20, 241, 149, 0.9);
                }
                .day.level-3 {
                    background: rgba(20, 241, 149, 0.5);
                    color: #fff;
                }
                .day.level-4 {
                    background: rgba(20, 241, 149, 0.75);
                    color: #000;
                    font-weight: 700;
                }
                .calendar-legend {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 6px;
                    margin-top: 10px;
                }
                .legend-label {
                    font-size: 0.6rem;
                    color: rgba(255, 255, 255, 0.3);
                }
                .legend-colors {
                    display: flex;
                    gap: 2px;
                }
                .legend-box {
                    width: 12px;
                    height: 12px;
                    border-radius: 2px;
                }
            `}</style>
        </div>
    );
}
