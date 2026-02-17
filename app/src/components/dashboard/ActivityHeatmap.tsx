'use client';

import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { subDays, format } from 'date-fns';

interface Activity {
    date: string;
    count: number;
}

interface ActivityHeatmapProps {
    data?: Activity[];
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
    // Generate random dummy data for the last 365 days if no data provided
    const dummyData = data || Array.from({ length: 365 }).map((_, i) => {
        const date = subDays(new Date(), i);
        return {
            date: format(date, 'yyyy-MM-dd'),
            count: Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0,
        };
    }).reverse();

    return (
        <div className="w-full bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100">Contribution Activity</h3>
                <div className="text-xs text-slate-500 flex gap-2 items-center">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 bg-gray-200 dark:bg-gray-800 rounded-xs"></div>
                        <div className="w-3 h-3 bg-green-900/40 rounded-xs"></div>
                        <div className="w-3 h-3 bg-green-700/60 rounded-xs"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-xs"></div>
                    </div>
                    <span>More</span>
                </div>
            </div>

            <div className="w-full overflow-x-auto pb-2">
                <div className="min-w-[700px]">
                    <CalendarHeatmap
                        startDate={subDays(new Date(), 365)}
                        endDate={new Date()}
                        values={dummyData}
                        classForValue={(value: { date: string; count: number } | null) => {
                            if (!value || value.count === 0) {
                                return 'fill-gray-200 dark:fill-gray-800';
                            }
                            if (value.count === 1) return 'fill-green-900/40';
                            if (value.count === 2) return 'fill-green-700/60';
                            if (value.count >= 3) return 'fill-green-500';
                            return 'fill-green-500';
                        }}
                        showWeekdayLabels={true}
                        onClick={(value: { date: string; count: number } | null) => {
                            if (value) {
                                alert(`On ${value.date}, you made ${value.count} contributions.`);
                            }
                        }}
                        gutterSize={3}
                    />
                </div>
            </div>

            <style jsx global>{`
        .react-calendar-heatmap text {
          display: none; /* Hide default labels if they don't fit well or use custom tooltips */
          font-size: 10px;
          fill: #aaa;
        }
        .react-calendar-heatmap .fill-gray-200 { fill: #e5e7eb; }
        .react-calendar-heatmap .fill-gray-800 { fill: #1f2937; }
        .react-calendar-heatmap .fill-green-900\\/40 { fill: #064e3b66; }
        .react-calendar-heatmap .fill-green-700\\/60 { fill: #15803d99; }
        .react-calendar-heatmap .fill-green-500 { fill: #22c55e; }
        
        /* Dark mode overrides if not handled by class names directly */
        .dark .react-calendar-heatmap .fill-gray-200 { fill: #1f2937; } 
      `}</style>
        </div>
    );
}
