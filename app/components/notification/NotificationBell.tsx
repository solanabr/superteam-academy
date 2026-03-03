/**
 * Notification Bell — header icon with unread badge.
 * Shows unread count and toggles the NotificationDropdown.
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/context/stores/notificationStore';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationBell() {
    const { unreadCount, notifications } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    return (
        <div ref={bellRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-card hover:bg-muted transition-colors relative text-lg cursor-pointer"
            >
                🔔
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[10px] font-bold min-w-[1.125rem] h-[1.125rem] flex items-center justify-center px-1 leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <NotificationDropdown
                    notifications={notifications}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
