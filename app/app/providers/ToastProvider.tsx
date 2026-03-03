'use client';

import { GoeyToaster } from 'goey-toast';
import 'goey-toast/styles.css';
import { useState, useEffect } from 'react';

export function ToastProvider() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark');
        setTheme(isDark ? 'dark' : 'light');

        const observer = new MutationObserver(() => {
            setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    return <GoeyToaster position="bottom-right" theme={theme} />;
}
