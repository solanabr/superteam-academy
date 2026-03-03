/**
 * PWA Install Prompt — shows a banner prompting the user
 * to install the app as a PWA on first/repeated visits.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if already dismissed in this session
        if (typeof window !== 'undefined' && sessionStorage.getItem('pwa-dismissed')) {
            return;
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = useCallback(async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowBanner(false);
        }
        setDeferredPrompt(null);
    }, [deferredPrompt]);

    const handleDismiss = useCallback(() => {
        setShowBanner(false);
        setDismissed(true);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pwa-dismissed', '1');
        }
    }, []);

    if (!showBanner || dismissed) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '1.5rem',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9998,
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.5rem',
                borderRadius: '1rem',
                background: 'rgba(15, 15, 25, 0.95)',
                border: '1px solid rgba(153, 69, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(12px)',
                color: '#fff',
                fontSize: '0.875rem',
                maxWidth: '440px',
                width: 'calc(100% - 3rem)',
            }}
        >
            <span style={{ fontSize: '1.5rem' }}>📱</span>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.125rem' }}>Install Academy App</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8125rem' }}>
                    Get offline access &amp; push notifications
                </div>
            </div>
            <button
                onClick={handleInstall}
                style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    background: 'linear-gradient(135deg, #9945FF, #14F195)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                }}
            >
                Install
            </button>
            <button
                onClick={handleDismiss}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    fontSize: '1.125rem',
                    padding: '0.25rem',
                    lineHeight: 1,
                }}
                aria-label="Dismiss"
            >
                ×
            </button>
        </div>
    );
}
