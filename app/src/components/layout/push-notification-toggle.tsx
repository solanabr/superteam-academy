'use client';

import { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';

interface PushNotificationState {
  supported: boolean;
  enabled: boolean;
  loading: boolean;
}

function base64UrlToArrayBuffer(base64UrlString: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64UrlString.length % 4)) % 4);
  const base64 = (base64UrlString + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }

  return output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength);
}

export function PushNotificationToggle() {
  const [state, setState] = useState<PushNotificationState>({
    supported: false,
    enabled: false,
    loading: true,
  });

  // Check push notification support on mount
  useEffect(() => {
    const checkPushSupport = async () => {
      const supported =
        'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

      if (!supported) {
        setState((s) => ({ ...s, supported: false, loading: false }));
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        const permission = Notification.permission;

        setState((s) => ({
          ...s,
          supported: true,
          enabled: subscription !== null && permission === 'granted',
          loading: false,
        }));
      } catch (error) {
        console.error('Error checking push notification status:', error);
        setState((s) => ({ ...s, supported: false, loading: false }));
      }
    };

    checkPushSupport();
  }, []);

  async function togglePushNotifications() {
    try {
      setState((s) => ({ ...s, loading: true }));

      if (state.enabled) {
        // Disable push notifications
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await fetch('/api/push/subscriptions', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
        }
        setState((s) => ({ ...s, enabled: false }));
      } else {
        // Enable push notifications
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Notification permission denied');
        }

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          throw new Error('Push notifications are not configured (missing VAPID public key)');
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToArrayBuffer(vapidPublicKey),
        });

        // Save subscription to server
        const response = await fetch('/api/push/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
          }),
        });

        if (!response.ok) {
          await subscription.unsubscribe();
          throw new Error('Failed to save push subscription');
        }

        setState((s) => ({ ...s, enabled: true }));
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
    } finally {
      setState((s) => ({ ...s, loading: false }));
    }
  }

  if (!state.supported) {
    return null;
  }

  return (
    <button
      onClick={togglePushNotifications}
      disabled={state.loading}
      className={`rounded-lg px-4 py-2 font-medium transition-colors ${
        state.enabled
          ? 'bg-green-500 text-white hover:bg-green-600'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
      } ${state.loading ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      {state.loading ? (
        <Loader className="mr-2 inline-block h-4 w-4 animate-spin" />
      ) : state.enabled ? (
        '🔔 Notifications On'
      ) : (
        '🔕 Enable Notifications'
      )}
    </button>
  );
}
