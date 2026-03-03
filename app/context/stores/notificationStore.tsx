/**
 * Notification Store — React Context-based notification state.
 *
 * Provides addNotification, markAsRead, markAllAsRead, clearNotifications.
 * Max 100 notifications in memory. No external dependencies (no Zustand).
 */

'use client';

import React, { createContext, useContext, useCallback, useReducer, type ReactNode } from 'react';

// ── Types ────────────────────────────────────────────────────────────

export type NotificationType =
    | 'lesson_complete'
    | 'course_complete'
    | 'achievement_unlock'
    | 'credential_issued'
    | 'streak_milestone'
    | 'daily_login_claim'
    | 'level_up'
    | 'reply'
    | 'mention'
    | 'system';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    read: boolean;
    createdAt: number;
}

export interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
}

// ── Actions ──────────────────────────────────────────────────────────

type NotificationAction =
    | { type: 'ADD'; notification: Notification }
    | { type: 'MARK_READ'; id: string }
    | { type: 'MARK_ALL_READ' }
    | { type: 'REMOVE'; id: string }
    | { type: 'CLEAR' };

const MAX_NOTIFICATIONS = 100;

function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
    switch (action.type) {
        case 'ADD':
            return {
                notifications: [action.notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
                unreadCount: state.unreadCount + 1,
            };
        case 'MARK_READ': {
            const notif = state.notifications.find((n) => n.id === action.id);
            if (!notif || notif.read) return state;
            return {
                notifications: state.notifications.map((n) =>
                    n.id === action.id ? { ...n, read: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
            };
        }
        case 'MARK_ALL_READ':
            return {
                notifications: state.notifications.map((n) => ({ ...n, read: true })),
                unreadCount: 0,
            };
        case 'REMOVE': {
            const toRemove = state.notifications.find((n) => n.id === action.id);
            return {
                notifications: state.notifications.filter((n) => n.id !== action.id),
                unreadCount: toRemove && !toRemove.read
                    ? Math.max(0, state.unreadCount - 1)
                    : state.unreadCount,
            };
        }
        case 'CLEAR':
            return { notifications: [], unreadCount: 0 };
        default:
            return state;
    }
}

// ── Context ──────────────────────────────────────────────────────────

interface NotificationContextValue extends NotificationState {
    addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    removeNotification: (id: string) => void;
    clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(notificationReducer, {
        notifications: [],
        unreadCount: 0,
    });

    const addNotification = useCallback(
        (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
            const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            dispatch({
                type: 'ADD',
                notification: {
                    ...notification,
                    id,
                    read: false,
                    createdAt: Date.now(),
                },
            });
        },
        []
    );

    const markAsRead = useCallback((id: string) => dispatch({ type: 'MARK_READ', id }), []);
    const markAllAsRead = useCallback(() => dispatch({ type: 'MARK_ALL_READ' }), []);
    const removeNotification = useCallback((id: string) => dispatch({ type: 'REMOVE', id }), []);
    const clearNotifications = useCallback(() => dispatch({ type: 'CLEAR' }), []);

    return (
        <NotificationContext.Provider
            value={{
                ...state,
                addNotification,
                markAsRead,
                markAllAsRead,
                removeNotification,
                clearNotifications,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
