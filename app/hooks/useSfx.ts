"use client";

import { useCallback, useEffect, useState } from "react";

const SFX_STORAGE_KEY = "superteam-sfx-enabled";

// Generate 8-bit beep using Web Audio API
function playBeep(freq: number, duration: number, volume: number = 0.15) {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "square"; // classic 8-bit sound
        osc.frequency.value = freq;
        gain.gain.value = volume;

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration / 1000);

        // Cleanup
        osc.onended = () => ctx.close();
    } catch {
        // Audio not supported, fail silently
    }
}

export function useSfx() {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(SFX_STORAGE_KEY);
        setEnabled(stored === "true");
    }, []);

    const toggle = useCallback(() => {
        setEnabled((prev) => {
            const next = !prev;
            localStorage.setItem(SFX_STORAGE_KEY, String(next));
            if (next) {
                // Play a little confirmating beep
                playBeep(880, 80);
                setTimeout(() => playBeep(1100, 80), 100);
            }
            return next;
        });
    }, []);

    const playClick = useCallback(() => {
        if (!enabled) return;
        playBeep(660, 60);
    }, [enabled]);

    const playHover = useCallback(() => {
        if (!enabled) return;
        playBeep(440, 30, 0.06);
    }, [enabled]);

    const playSuccess = useCallback(() => {
        if (!enabled) return;
        playBeep(523, 80);
        setTimeout(() => playBeep(659, 80), 100);
        setTimeout(() => playBeep(784, 120), 200);
    }, [enabled]);

    return { enabled, toggle, playClick, playHover, playSuccess };
}
