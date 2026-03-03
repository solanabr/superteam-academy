/**
 * Push Notifications Hook — browser push notification support.
 *
 * Handles:
 * - Feature detection (Notification API + Service Worker)
 * - Permission request
 * - VAPID subscription (when NEXT_PUBLIC_VAPID_KEY is set)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export function usePushNotifications() {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        const supported = typeof window !== 'undefined'
            && 'Notification' in window
            && 'serviceWorker' in navigator;
        setIsSupported(supported);

        if (supported) {
            setPermission(Notification.permission);
            setIsSubscribed(Notification.permission === 'granted');
        }
    }, []);

    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!isSupported) return false;

        const result = await Notification.requestPermission();
        setPermission(result);
        setIsSubscribed(result === 'granted');
        return result === 'granted';
    }, [isSupported]);

    const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
        if (!isSupported) return null;

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
        if (!vapidKey) {
            console.warn('[Push] NEXT_PUBLIC_VAPID_KEY not configured — skipping push subscription');
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidKey,
            });

            // Send subscription to server
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription.toJSON()),
            });

            setIsSubscribed(true);
            return subscription;
        } catch (error) {
            console.error('[Push] Failed to subscribe:', error);
            return null;
        }
    }, [isSupported]);

    const unsubscribe = useCallback(async (): Promise<void> => {
        if (!isSupported) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                setIsSubscribed(false);
            }
        } catch (error) {
            console.error('[Push] Failed to unsubscribe:', error);
        }
    }, [isSupported]);

    return {
        isSupported,
        permission,
        isSubscribed,
        requestPermission,
        subscribe,
        unsubscribe,
    };
}
